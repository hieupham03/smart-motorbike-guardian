#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>

// =========================================================================
// SMART MOTORBIKE GUARDIAN - BỘ GIẢ LẬP CHUẨN TOÀN DIỆN (WOKWI SIMULATOR)
// Dành cho toàn bộ thành viên nhóm kiểm thử và hiểu kiến trúc hoạt động IoT
// =========================================================================

// --- Cấu hình Wi-Fi Wokwi & MQTT Broker ---
#define WIFI_SSID       "Wokwi-GUEST"
#define WIFI_PASSWORD   ""
#define MQTT_BROKER     "broker.emqx.io"
#define MQTT_PORT       1883

// UUID chuẩn của xe Honda SH 150i ABS trong Database
#define DEVICE_ID       "550e8400-e29b-41d4-a716-446655440001"
#define DEV_ALIAS       "dev-550e8400-0001"

// Các Topic MQTT trao đổi 2 chiều với Backend & Web Dashboard
#define TOPIC_TELEMETRY "guardian/" DEVICE_ID "/telemetry"
#define TOPIC_ALERT     "guardian/" DEVICE_ID "/alert"
#define TOPIC_STATUS    "guardian/" DEVICE_ID "/status"
#define TOPIC_CMD_SUB1  "guardian/" DEVICE_ID "/cmd/#"
#define TOPIC_CMD_SUB2  "guardian/" DEV_ALIAS "/cmd/#"
#define TOPIC_CMD_ACK   "guardian/" DEVICE_ID "/cmd/ack"

// --- Sơ đồ nối chân phần cứng (ESP32 DevKit V4) ---
#define PIN_RELAY       23  // Ngắt nguồn Motor DC (Mức THẤP: đóng tiếp điểm NO; Mức CAO: ngắt nguồn)
#define PIN_BUZZER      18  // Còi báo động chống trộm
#define PIN_LED         19  // Đèn LED hiển thị trạng thái an ninh
#define PIN_HALL        4   // Cảm biến từ trường Hall KY-003 (Đo xung vòng quay bánh xe)
#define PIN_SDA         21  // Đường I2C Data MPU-6050
#define PIN_SCL         22  // Đường I2C Clock MPU-6050

// Địa chỉ I2C của cảm biến MPU-6050
#define MPU_ADDR        0x68

// --- Định nghĩa 4 trạng thái an ninh ---
enum SecurityState {
    STATE_PARKED     = 0, // Xe đỗ bình thường, tắt bảo vệ
    STATE_ARMED      = 1, // Kích hoạt chế độ Canh giữ (Giám sát rung lắc / trộm)
    STATE_ALARM      = 2, // Đang phát hiện xâm phạm: Còi hú, gửi cảnh báo khẩn
    STATE_THEFT_LOCK = 3  // Đã kích hoạt chốt khóa động cơ an toàn
};

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Biến đo lường cảm biến
volatile uint32_t hallPulses = 0;
float currentSpeed = 0.0f;
float ax = 0.0f, ay = 0.0f, az = 9.81f;
float tiltAngle = 0.0f;
float dynamicAccel = 0.0f;

SecurityState currentState = STATE_PARKED;
bool isRelayCut = false;
bool isSirenActive = false;

// Bộ lọc Debounce và Cooldown
uint8_t consecutiveVibeCount = 0;
uint32_t lastAlertTime = 0;
uint32_t tiltStartTime = 0;
uint32_t lastTelemetrySend = 0;
uint32_t lastSpeedCalc = 0;
uint32_t lastLedBlink = 0;
bool ledState = false;

// Ngắt phần cứng ISR khi nam châm bánh xe quét qua cảm biến Hall
void IRAM_ATTR onHallPulse() {
    static uint32_t lastPulseMs = 0;
    uint32_t now = millis();
    if (now - lastPulseMs >= 15) { // Debounce chống rung 15ms
        hallPulses++;
        lastPulseMs = now;
    }
}

// Khởi động cảm biến gia tốc MPU-6050 qua I2C trực tiếp
bool initMPU6050() {
    Wire.begin(PIN_SDA, PIN_SCL);
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x6B); // Thanh ghi quản lý nguồn PWR_MGMT_1
    Wire.write(0x00); // Đánh thức chip dậy (Thoát Sleep mode)
    byte err = Wire.endTransmission();
    return (err == 0);
}

// Đọc giá trị gia tốc 3 trục từ MPU-6050
bool readMPU6050(float &outAx, float &outAy, float &outAz) {
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B); // Thanh ghi bắt đầu dữ liệu gia tốc ACCEL_XOUT_H
    if (Wire.endTransmission(false) != 0) return false;

    if (Wire.requestFrom(MPU_ADDR, 6) != 6) return false;

    int16_t rawX = (Wire.read() << 8) | Wire.read();
    int16_t rawY = (Wire.read() << 8) | Wire.read();
    int16_t rawZ = (Wire.read() << 8) | Wire.read();

    // Hệ số tỷ lệ chuẩn của thang đo +-2g (16384 LSB/g) -> m/s2
    const float SCALE = 9.80665f / 16384.0f;
    outAx = rawX * SCALE;
    outAy = rawY * SCALE;
    outAz = rawZ * SCALE;
    return true;
}

// Gửi bản tin cảnh báo lên MQTT
void publishAlert(const char* alertType, float metricValue) {
    char payload[192];
    snprintf(payload, sizeof(payload),
             "{\"event_type\":\"%s\",\"value\":%.2f,\"speed\":%.1f,\"state\":%d,\"ts\":%lu}",
             alertType, metricValue, currentSpeed, (int)currentState, (unsigned long)(millis() / 1000));
    mqttClient.publish(TOPIC_ALERT, payload);
    Serial.printf("\n🚨 [CẢNH BÁO PHÁT SINH] Loại: %s | Giá trị: %.2f | Vận tốc: %.1f km/h\n",
                  alertType, metricValue, currentSpeed);
}

// Xử lý các lệnh điều khiển Downlink nhận từ Web Dashboard
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    char msg[256];
    if (length < sizeof(msg)) {
        memcpy(msg, payload, length);
        msg[length] = '\0';
    } else {
        return;
    }

    Serial.printf("\n📥 [LỆNH WEB NHẬN ĐƯỢC] Topic: %s\n   Payload: %s\n", topic, msg);

    // Tách cmd_id nếu có
    char cmdId[64] = "cmd-sim";
    char *cmdIdPtr = strstr(msg, "\"cmd_id\":\"");
    if (cmdIdPtr) {
        sscanf(cmdIdPtr + 10, "%[^\"]", cmdId);
    }

    // 1. LỆNH KHOÁ ĐỘNG CƠ KHẨN CẤP (LOCK_ENGINE) - Kiểm tra ràng buộc an toàn S-07
    if (strstr(msg, "\"LOCK_ENGINE\"") || strstr(topic, "/lock")) {
        Serial.println("⚙️ [Kiểm tra an toàn S-07] Nhận lệnh LOCK_ENGINE...");
        if (currentSpeed <= 0.5f) {
            // Xe đã dừng hẳn -> Cho phép ngắt nguồn an toàn
            digitalWrite(PIN_RELAY, HIGH); // Mức HIGH ngắt tiếp điểm rơ-le
            isRelayCut = true;
            currentState = STATE_THEFT_LOCK;
            Serial.println("  -> [THỰC THI THÀNH CÔNG] Relay đã NGẮT NGUỒN Motor DC!");

            char ack[192];
            snprintf(ack, sizeof(ack), "{\"cmd_id\":\"%s\",\"result\":\"EXECUTED\",\"ts\":%lu}",
                     cmdId, (unsigned long)(millis() / 1000));
            mqttClient.publish(TOPIC_CMD_ACK, ack);
        } else {
            // Xe đang chạy -> BẢO VỆ TÍNH MẠNG: TỪ CHỐI LỆNH TẠI BIÊN PHẦN CỨNG
            Serial.printf("  -> [TỪ CHỐI AN TOÀN S-07] Tốc độ xe = %.1f km/h > 0! Nghiêm cấm ngắt nguồn!\n", currentSpeed);
            char ack[192];
            snprintf(ack, sizeof(ack),
                     "{\"cmd_id\":\"%s\",\"result\":\"REJECTED\",\"reason\":\"SPEED_NOT_ZERO\",\"ts\":%lu}",
                     cmdId, (unsigned long)(millis() / 1000));
            mqttClient.publish(TOPIC_CMD_ACK, ack);
        }
    }
    // 2. LỆNH MỞ KHOÁ ĐỘNG CƠ (UNLOCK_ENGINE)
    else if (strstr(msg, "\"UNLOCK_ENGINE\"") || strstr(topic, "/unlock")) {
        digitalWrite(PIN_RELAY, LOW); // Đóng lại tiếp điểm rơ-le
        isRelayCut = false;
        currentState = STATE_PARKED;
        digitalWrite(PIN_BUZZER, LOW);
        isSirenActive = false;
        Serial.println("🔓 [THỰC THI] Đã cấp nguồn lại cho Motor (Trạng thái PARKED).");

        char ack[192];
        snprintf(ack, sizeof(ack), "{\"cmd_id\":\"%s\",\"result\":\"EXECUTED\",\"ts\":%lu}",
                 cmdId, (unsigned long)(millis() / 1000));
        mqttClient.publish(TOPIC_CMD_ACK, ack);
    }
    // 3. LỆNH KÍCH HOẠT CHẾ ĐỘ CANH GIỮ (ARM)
    else if (strstr(msg, "\"ARM\"") || strstr(topic, "/arm")) {
        currentState = STATE_ARMED;
        Serial.println("🛡️ [THỰC THI] Xe chuyển sang chế độ CANH GIỮ (ARMED). Đang giám sát chuyển động!");

        char ack[192];
        snprintf(ack, sizeof(ack), "{\"cmd_id\":\"%s\",\"result\":\"EXECUTED\",\"ts\":%lu}",
                 cmdId, (unsigned long)(millis() / 1000));
        mqttClient.publish(TOPIC_CMD_ACK, ack);
    }
    // 4. LỆNH HUỶ CANH GIỮ (DISARM)
    else if (strstr(msg, "\"DISARM\"") || strstr(topic, "/disarm")) {
        currentState = STATE_PARKED;
        digitalWrite(PIN_BUZZER, LOW);
        isSirenActive = false;
        Serial.println("🅿️ [THỰC THI] Huỷ chế độ canh giữ. Xe trở về trạng thái ĐỖ (PARKED).");

        char ack[192];
        snprintf(ack, sizeof(ack), "{\"cmd_id\":\"%s\",\"result\":\"EXECUTED\",\"ts\":%lu}",
                 cmdId, (unsigned long)(millis() / 1000));
        mqttClient.publish(TOPIC_CMD_ACK, ack);
    }
    // 5. BẬT CÒI BÁO ĐỘNG TÌM XE (SIREN_ON)
    else if (strstr(msg, "\"SIREN_ON\"") || strstr(topic, "/siren_on")) {
        digitalWrite(PIN_BUZZER, HIGH);
        isSirenActive = true;
        Serial.println("🔊 [THỰC THI] Còi hú báo động đang BẬT.");
    }
    // 6. TẮT CÒI BÁO ĐỘNG (SIREN_OFF)
    else if (strstr(msg, "\"SIREN_OFF\"") || strstr(topic, "/siren_off")) {
        digitalWrite(PIN_BUZZER, LOW);
        isSirenActive = false;
        Serial.println("🔇 [THỰC THI] Còi hú báo động đã TẮT.");
    }
    // 7. KHỞI ĐỘNG LẠI (REBOOT) - Cũng kiểm tra ràng buộc tốc độ an toàn
    else if (strstr(msg, "\"REBOOT\"") || strstr(topic, "/reboot")) {
        if (currentSpeed <= 0.5f) {
            Serial.println("🔄 [REBOOT] Tốc độ an toàn (= 0 km/h), khởi động lại hệ thống...");
            char ack[192];
            snprintf(ack, sizeof(ack), "{\"cmd_id\":\"%s\",\"result\":\"EXECUTED\",\"ts\":%lu}",
                     cmdId, (unsigned long)(millis() / 1000));
            mqttClient.publish(TOPIC_CMD_ACK, ack);
            delay(500);
            ESP.restart();
        } else {
            Serial.println("⚠️ [TỪ CHỐI REBOOT S-07] Xe đang chạy, không cho phép reset chip!");
            char ack[192];
            snprintf(ack, sizeof(ack),
                     "{\"cmd_id\":\"%s\",\"result\":\"REJECTED\",\"reason\":\"SPEED_NOT_ZERO\",\"ts\":%lu}",
                     cmdId, (unsigned long)(millis() / 1000));
            mqttClient.publish(TOPIC_CMD_ACK, ack);
        }
    }
}

void printBanner() {
    Serial.println("\n========================================================");
    Serial.println("     SMART MOTORBIKE GUARDIAN - WOKWI SIMULATOR");
    Serial.println("   Hệ thống IoT Giám Sát & An Ninh Xe Máy Hai Lớp");
    Serial.println("========================================================");
    Serial.println("👉 HƯỚNG DẪN TEST TÍNH NĂNG CHO CÁC THÀNH VIÊN:");
    Serial.println("1. [Đo tốc độ]: Nhấp nút xanh lá 'Hall Pulse' để tạo xung bánh xe.");
    Serial.println("2. [Ngã xe]: Nhấp vào MPU-6050, chỉnh góc nghiêng > 50 độ.");
    Serial.println("3. [Rung lắc/Trộm]: Chỉnh gia tốc trục X, Y mạnh khi đang ARMED.");
    Serial.println("4. [Ràng buộc an toàn S-07]: Bấm nút tạo tốc độ > 0 rồi lên Web");
    Serial.println("   bấm LOCK_ENGINE -> Xem ESP32 từ chối để chống tai nạn!");
    Serial.println("5. [Khoá xe thật]: Để tốc độ = 0 km/h, bấm LOCK_ENGINE trên Web");
    Serial.println("   -> Relay nhảy ngắt nguồn, đèn LED động cơ tắt lịm!");
    Serial.println("========================================================\n");
}

void setup() {
    Serial.begin(115200);
    delay(400);

    printBanner();

    pinMode(PIN_RELAY, OUTPUT);
    pinMode(PIN_BUZZER, OUTPUT);
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_RELAY, LOW); // Mặc định đóng tiếp điểm, cấp nguồn cho motor
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED, LOW);

    // Ngắt xung cảm biến Hall
    pinMode(PIN_HALL, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(PIN_HALL), onHallPulse, FALLING);
    Serial.println("✓ Khởi tạo ngắt xung cảm biến Hall trên GPIO 4 thành công.");

    // Khởi tạo MPU-6050
    if (initMPU6050()) {
        Serial.println("✓ Cảm biến gia tốc MPU-6050 kết nối I2C thành công (0x68).");
    } else {
        Serial.println("⚠️ Chưa phát hiện MPU-6050 thực, sử dụng thông số mặc định.");
    }

    // Kết nối Wi-Fi Wokwi ảo
    Serial.print("📶 Đang kết nối Wi-Fi Wokwi-GUEST...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    uint8_t wifiRetry = 0;
    while (WiFi.status() != WL_CONNECTED && wifiRetry < 20) {
        delay(300);
        Serial.print(".");
        wifiRetry++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n✓ Wi-Fi đã kết nối! IP được cấp: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\n⚠️ Chế độ ngoại tuyến (Offline Simulation Mode).");
    }

    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);
}

void loop() {
    uint32_t now = millis();

    // Duy trì kết nối MQTT Broker
    if (WiFi.status() == WL_CONNECTED) {
        if (!mqttClient.connected()) {
            static uint32_t lastMqttReconnect = 0;
            if (now - lastMqttReconnect >= 4000) {
                lastMqttReconnect = now;
                Serial.printf("🔗 Đang kết nối MQTT Broker (%s:1883)...\n", MQTT_BROKER);
                if (mqttClient.connect(DEVICE_ID)) {
                    Serial.println("✓ Đã kết nối Broker MQTT EMQX thành công!");
                    mqttClient.subscribe(TOPIC_CMD_SUB1);
                    mqttClient.subscribe(TOPIC_CMD_SUB2);
                    Serial.println("✓ Đã đăng ký lắng nghe Topic lệnh điều khiển từ Web Dashboard.");
                }
            }
        } else {
            mqttClient.loop();
        }
    }

    // 1. Tính toán vận tốc xe mỗi 250ms từ cảm biến Hall
    if (now - lastSpeedCalc >= 250) {
        float dt = (now - lastSpeedCalc) / 1000.0f;
        lastSpeedCalc = now;

        uint32_t pulses = hallPulses;
        hallPulses = 0;

        // Bán kính bánh xe giả định 0.5m -> 1 vòng = 0.5m
        if (dt > 0.0f) {
            float speed_mps = (pulses * 0.5f) / dt;
            float calcSpeed = speed_mps * 3.6f;
            // Làm mượt vận tốc (exponential smoothing)
            currentSpeed = (currentSpeed * 0.7f) + (calcSpeed * 0.3f);
            if (currentSpeed < 0.2f && pulses == 0) currentSpeed = 0.0f;
        }
    }

    // 2. Đọc và phân tích dữ liệu MPU-6050
    readMPU6050(ax, ay, az);

    // Tính góc nghiêng thân xe (Tilt Angle)
    tiltAngle = atan2(sqrt(ax * ax + ay * ay), fabs(az > 0.01f ? az : 1.0f)) * (180.0f / 3.14159265f);

    // Tính gia tốc động (Dynamic Acceleration đã bù trọng lực tĩnh 9.81 m/s2)
    dynamicAccel = sqrt(ax * ax + ay * ay + (az - 9.81f) * (az - 9.81f));

    // 3. THUẬT TOÁN PHÁT HIỆN NGÃ XE THÔNG MINH (Chống ôm cua)
    if (tiltAngle > 50.0f) {
        if (tiltStartTime == 0) tiltStartTime = now;

        // Điều kiện ngã xe thật: Xe dừng khựng (speed <= 2 km/h) HOẶC nghiêng liên tục > 2 giây
        bool isRealFall = (currentSpeed <= 2.0f && (now - tiltStartTime >= 500)) ||
                          (now - tiltStartTime >= 2000);

        if (isRealFall && (now - lastAlertTime >= 5000)) {
            lastAlertTime = now;
            publishAlert("FALL_DETECTED", tiltAngle);
            if (currentState != STATE_THEFT_LOCK) {
                currentState = STATE_ALARM;
                digitalWrite(PIN_BUZZER, HIGH);
                isSirenActive = true;
            }
        }
    } else {
        tiltStartTime = 0;
    }

    // 4. PHÁT HIỆN RUNG LẮC KHI Ở CHẾ ĐỘ CANH GIỮ (ARMED)
    if (currentState == STATE_ARMED) {
        if (dynamicAccel > 3.5f) {
            consecutiveVibeCount++;
            // Debounce: Yêu cầu 3 mẫu liên tiếp vượt ngưỡng
            if (consecutiveVibeCount >= 3 && (now - lastAlertTime >= 4000)) {
                lastAlertTime = now;
                consecutiveVibeCount = 0;
                publishAlert("MOTION_WHILE_ARMED", dynamicAccel);
                currentState = STATE_ALARM;
                digitalWrite(PIN_BUZZER, HIGH);
                isSirenActive = true;
            }
        } else {
            if (consecutiveVibeCount > 0) consecutiveVibeCount--;
        }
    }

    // 5. Điều khiển đèn LED nháy theo trạng thái an ninh
    uint32_t blinkInterval = 1000;
    if (currentState == STATE_ALARM) blinkInterval = 150;      // Nháy cực nhanh khi báo động
    else if (currentState == STATE_ARMED) blinkInterval = 800; // Nháy đều khi đang canh giữ
    else if (currentState == STATE_THEFT_LOCK) blinkInterval = 0; // Sáng cố định khi khóa xe

    if (blinkInterval > 0) {
        if (now - lastLedBlink >= blinkInterval) {
            lastLedBlink = now;
            ledState = !ledState;
            digitalWrite(PIN_LED, ledState ? HIGH : LOW);
        }
    } else {
        digitalWrite(PIN_LED, HIGH);
    }

    // 6. Gửi Telemetry định kỳ mỗi 1.0 giây lên MQTT Web Dashboard
    if (now - lastTelemetrySend >= 1000) {
        lastTelemetrySend = now;

        char telemJson[256];
        snprintf(telemJson, sizeof(telemJson),
                 "{\"speed\":%.1f,\"battery\":12.4,\"ax\":%.2f,\"ay\":%.2f,\"az\":%.2f,\"state\":%d,\"tilt\":%.1f,\"ts\":%lu}",
                 currentSpeed, ax, ay, az, (int)currentState, tiltAngle, (unsigned long)(now / 1000));

        if (mqttClient.connected()) {
            mqttClient.publish(TOPIC_TELEMETRY, telemJson);
        }

        // In trạng thái ra Serial Monitor
        const char* stateNames[] = {"PARKED", "ARMED", "ALARM", "THEFT_LOCK"};
        Serial.printf("[Tele] Vận tốc: %4.1f km/h | Nghiêng: %4.1f° | Gia tốc: %4.1f m/s² | Trạng thái: %-10s | Motor: %s\n",
                      currentSpeed, tiltAngle, dynamicAccel, stateNames[currentState],
                      isRelayCut ? "⛔ ĐÃ NGẮT NGUỒN" : "🟢 ĐANG CẤP NGUỒN");
    }
}
