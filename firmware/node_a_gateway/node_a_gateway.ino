#include "uart_protocol.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_task_wdt.h>

// --- Cấu hình Wi-Fi & MQTT Broker ---
#define WIFI_SSID       "P103"          // Thay tên Wi-Fi
#define WIFI_PASSWORD   "7421yenxa"          // Thay mật khẩu Wi-Fi

#define MQTT_BROKER     "broker.emqx.io"          // MQTT Broker công cộng hoặc IP local
#define MQTT_PORT       1883
#define DEVICE_ID       "550e8400-e29b-41d4-a716-446655440001" // UUID xe mau Honda SH 150i ABS

// Topic MQTT chuẩn hóa
#define TOPIC_STATUS    "guardian/" DEVICE_ID "/status"
#define TOPIC_TELEMETRY "guardian/" DEVICE_ID "/telemetry"
#define TOPIC_ALERT     "guardian/" DEVICE_ID "/alert"
#define TOPIC_CMD_SUB   "guardian/" DEVICE_ID "/cmd/#"
#define TOPIC_CMD_ACK   "guardian/" DEVICE_ID "/cmd/ack"
#define TOPIC_HEARTBEAT "guardian/" DEVICE_ID "/heartbeat"

// --- Cấu hình phần cứng & Chân giao tiếp (Node A Gateway) ---
#define RXD2 16
#define TXD2 17
#define UART_BAUD 115200

#define PIN_RELAY   23  // Điều khiển rơ-le ngắt nguồn động cơ
#define PIN_BUZZER  18  // Còi báo động
#define PIN_LED     2   // LED Onboard chỉ thị trạng thái

HardwareSerial CommSerial(2);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// --- Trạng thái hệ thống & Đồng bộ FreeRTOS ---
enum VehicleState : uint8_t {
    STATE_PARKED     = 0, // Bình thường / Mở khóa
    STATE_ARMED      = 1, // Bật chế độ chống trộm
    STATE_ALARM      = 2, // Báo động (còi hú & nháy LED)
    STATE_THEFT_LOCK = 3  // Khóa cứng (ngắt rơ-le động cơ)
};

const char* state_to_string(VehicleState s) {
    switch (s) {
        case STATE_PARKED:     return "PARKED";
        case STATE_ARMED:      return "ARMED";
        case STATE_ALARM:      return "ALARM";
        case STATE_THEFT_LOCK: return "THEFT_LOCK";
        default:               return "UNKNOWN";
    }
}

struct ControlCommand {
    uint8_t target_state;
    bool cut_power;
};

// Dữ liệu chia sẻ được bảo vệ bởi Mutex
static TelemetryData sharedTelemetry = {0};
static SemaphoreHandle_t telemetryMutex = NULL;

static QueueHandle_t controlQueue = NULL;
static QueueHandle_t alertMqttQueue = NULL;

static volatile uint32_t lastSensorHeartbeat = 0;
static volatile bool sensorConnected = false;
static volatile VehicleState currentState = STATE_PARKED;

// --- Bộ đệm Offline Ring Buffer (NFR-05: Lưu trữ sự cố khi mất mạng) ---
#define OFFLINE_BUFFER_CAPACITY 30

struct BufferedMqttMessage {
    char topic[64];
    char payload[320];
    uint8_t qos;
    bool is_valid;
};

static BufferedMqttMessage offlineBuffer[OFFLINE_BUFFER_CAPACITY];
static uint8_t offlineHead = 0;
static uint8_t offlineTail = 0;
static uint8_t offlineCount = 0;
static SemaphoreHandle_t bufferMutex = NULL;

void enqueue_offline_message(const char* topic, const char* payload, uint8_t qos) {
    if (bufferMutex != NULL && xSemaphoreTake(bufferMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        strncpy(offlineBuffer[offlineHead].topic, topic, sizeof(offlineBuffer[offlineHead].topic) - 1);
        offlineBuffer[offlineHead].topic[sizeof(offlineBuffer[offlineHead].topic) - 1] = '\0';

        strncpy(offlineBuffer[offlineHead].payload, payload, sizeof(offlineBuffer[offlineHead].payload) - 1);
        offlineBuffer[offlineHead].payload[sizeof(offlineBuffer[offlineHead].payload) - 1] = '\0';

        offlineBuffer[offlineHead].qos = qos;
        offlineBuffer[offlineHead].is_valid = true;

        offlineHead = (offlineHead + 1) % OFFLINE_BUFFER_CAPACITY;
        if (offlineCount < OFFLINE_BUFFER_CAPACITY) {
            offlineCount++;
        } else {
            // Buffer đầy: Ghi đè tin cũ nhất (Tail dịch tới)
            offlineTail = (offlineTail + 1) % OFFLINE_BUFFER_CAPACITY;
        }
        xSemaphoreGive(bufferMutex);
    }
}

void flush_offline_messages() {
    if (!mqttClient.connected()) return;

    if (bufferMutex != NULL && xSemaphoreTake(bufferMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        if (offlineCount > 0) {
            Serial.printf("[Offline Buffer] Phat hien %u tin luu tru luc mat mang. Dang xả len Broker...\n", offlineCount);
        }
        while (offlineCount > 0 && mqttClient.connected()) {
            BufferedMqttMessage &msg = offlineBuffer[offlineTail];
            if (msg.is_valid) {
                mqttClient.publish(msg.topic, msg.payload);
                Serial.printf("[Offline Buffer Flush] -> Da gui bu: [%s]\n", msg.topic);
                msg.is_valid = false;
            }
            offlineTail = (offlineTail + 1) % OFFLINE_BUFFER_CAPACITY;
            offlineCount--;
            vTaskDelay(pdMS_TO_TICKS(25)); // Tránh ngập broker
        }
        xSemaphoreGive(bufferMutex);
    }
}

void publish_or_buffer(const char* topic, const char* payload, uint8_t qos = 1) {
    if (mqttClient.connected()) {
        mqttClient.publish(topic, payload);
    } else {
        Serial.printf("[Offline Buffer] Mat song mang -> Luu vao Buffer RAM (Slot %u/%u)\n", offlineCount + 1, OFFLINE_BUFFER_CAPACITY);
        enqueue_offline_message(topic, payload, qos);
    }
}

// --- Hàm điều khiển còi báo động ---
void set_buzzer(bool on) {
    static bool currentBuzzerState = false;
    if (on != currentBuzzerState) {
        currentBuzzerState = on;
        digitalWrite(PIN_BUZZER, on ? HIGH : LOW);
    }
}

// --- Callback MQTT: Xử lý lệnh điều khiển từ xa ---
void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    char message[256];
    if (length >= sizeof(message)) length = sizeof(message) - 1;
    memcpy(message, payload, length);
    message[length] = '\0';

    Serial.printf("\n[MQTT Rx] Topic: %s | Msg: %s\n", topic, message);

    char cmdId[40] = "cmd-default";
    char *pCmdId = strstr(message, "\"cmd_id\":\"");
    if (pCmdId) {
        pCmdId += 10;
        char *pEnd = strchr(pCmdId, '\"');
        if (pEnd) {
            int len = pEnd - pCmdId;
            if (len < sizeof(cmdId)) {
                strncpy(cmdId, pCmdId, len);
                cmdId[len] = '\0';
            }
        }
    }

    bool isExecuted = false;
    const char* reasonIfFailed = NULL;

    if (strstr(message, "\"DISARM\"") || strstr(topic, "/disarm")) {
        currentState = STATE_PARKED;
        set_buzzer(false);
        ControlCommand cmd = { .target_state = STATE_PARKED, .cut_power = false };
        if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);
        isExecuted = true;
        Serial.println("[Command] DISARMED (PARKED)");
    } 
    else if (strstr(message, "\"ARM\"") || strstr(topic, "/arm")) {
        currentState = STATE_ARMED;
        set_buzzer(false);
        ControlCommand cmd = { .target_state = STATE_ARMED, .cut_power = false };
        if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);
        isExecuted = true;
        Serial.println("[Command] ARMED activated");
    } 
    else if (strstr(message, "\"LOCK_ENGINE\"") || strstr(topic, "/lock_engine")) {
        // RÀNG BUỘC AN TOÀN: Chỉ ngắt relay khi tốc độ <= 0.5 km/h
        float spd = 0.0f;
        if (xSemaphoreTake(telemetryMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
            spd = sharedTelemetry.speed;
            xSemaphoreGive(telemetryMutex);
        }

        if (spd <= 0.5f) {
            currentState = STATE_THEFT_LOCK;
            ControlCommand cmd = { .target_state = STATE_THEFT_LOCK, .cut_power = true };
            if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);

            CmdRelayData relayCmd = { .state = 0, .seq = 1 };
            send_msg(CommSerial, MSG_CMD_RELAY, relayCmd);

            isExecuted = true;
            Serial.println("[Command] LOCK_ENGINE executed (Power Cut)");
        } else {
            isExecuted = false;
            reasonIfFailed = "SPEED_NOT_ZERO";
            Serial.printf("[Command] LOCK_ENGINE REJECTED: Speed = %.2f km/h > 0\n", spd);
        }
    }
    else if (strstr(message, "\"UNLOCK_ENGINE\"") || strstr(topic, "/unlock_engine")) {
        currentState = STATE_PARKED;
        ControlCommand cmd = { .target_state = STATE_PARKED, .cut_power = false };
        if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);

        CmdRelayData relayCmd = { .state = 1, .seq = 1 };
        send_msg(CommSerial, MSG_CMD_RELAY, relayCmd);

        isExecuted = true;
        Serial.println("[Command] UNLOCK_ENGINE executed (Relay Closed)");
    }
    else if (strstr(message, "\"SIREN_ON\"") || strstr(topic, "/siren_on")) {
        set_buzzer(true);
        currentState = STATE_ALARM;
        isExecuted = true;
        Serial.println("[Command] SIREN_ON executed (Buzzer ON)");
    }
    else if (strstr(message, "\"SIREN_OFF\"") || strstr(topic, "/siren_off")) {
        set_buzzer(false);
        if (currentState == STATE_ALARM) currentState = STATE_PARKED;
        isExecuted = true;
        Serial.println("[Command] SIREN_OFF executed (Buzzer OFF)");
    }
    else if (strstr(message, "\"REBOOT\"") || strstr(topic, "/reboot")) {
        // RÀNG BUỘC AN TOÀN S-07: Tuyệt đối không cho phép REBOOT khi xe đang chạy (v > 0.5 km/h)
        // để tránh vi điều khiển reset làm rơ-le ngắt nguồn đột ngột gây tai nạn!
        float spd = 0.0f;
        if (xSemaphoreTake(telemetryMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
            spd = sharedTelemetry.speed;
            xSemaphoreGive(telemetryMutex);
        }

        if (spd <= 0.5f) {
            isExecuted = true;
            Serial.println("[Command] REBOOT acknowledged (Speed = 0 km/h), restarting node...");
            char ackJson[192];
            snprintf(ackJson, sizeof(ackJson), 
                     "{\"cmd_id\":\"%s\",\"result\":\"EXECUTED\",\"ts\":%lu}",
                     cmdId, (unsigned long)(millis() / 1000));
            mqttClient.publish(TOPIC_CMD_ACK, ackJson);
            delay(600);
            ESP.restart();
            return;
        } else {
            isExecuted = false;
            reasonIfFailed = "SPEED_NOT_ZERO";
            Serial.printf("[Safety Block] REBOOT REJECTED: Speed = %.2f km/h > 0 (Safety Invariant S-07)\n", spd);
        }
    }

    // Phản hồi Command ACK
    char ackJson[192];
    snprintf(ackJson, sizeof(ackJson), 
             "{\"cmd_id\":\"%s\",\"result\":\"%s\",\"ts\":%lu,\"reason_if_failed\":%s%s%s}",
             cmdId, isExecuted ? "EXECUTED" : "REJECTED",
             (unsigned long)(millis() / 1000),
             reasonIfFailed ? "\"" : "", reasonIfFailed ? reasonIfFailed : "null", reasonIfFailed ? "\"" : "");

    mqttClient.publish(TOPIC_CMD_ACK, ackJson);
}

// --- Task 1: Nhận và giải mã dữ liệu UART từ Node B (Core 0) ---
void UARTRxTask(void *pvParameters) {
    UartPacket rxPacket;
    uint32_t lastHbTx = 0;
    uint8_t hbSeq = 0;

    for (;;) {
        while (CommSerial.available()) {
            uint8_t b = CommSerial.read();
            if (parse_byte(b, rxPacket)) {
                switch (rxPacket.type) {
                    case MSG_TELEMETRY: {
                        if (rxPacket.len == sizeof(TelemetryData)) {
                            if (xSemaphoreTake(telemetryMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
                                memcpy(&sharedTelemetry, rxPacket.data, sizeof(TelemetryData));
                                xSemaphoreGive(telemetryMutex);
                            }
                        }
                        break;
                    }

                    case MSG_ACCEL_EVENT: {
                        if (rxPacket.len == sizeof(AccelEventData)) {
                            AccelEventData evt;
                            memcpy(&evt, rxPacket.data, sizeof(AccelEventData));
                            Serial.printf("[Gateway] Sự kiện va chạm/rung: Type=%u, Accel=%.2f m/s2\n",
                                          evt.event_type, evt.value);

                            // Đẩy vào Queue gửi cảnh báo ngay lên MQTT
                            if (alertMqttQueue != NULL) {
                                xQueueSend(alertMqttQueue, &evt, 0);
                            }

                            // Kích hoạt báo động nếu xe đang ở chế độ ARMED
                            if (currentState == STATE_ARMED) {
                                currentState = STATE_ALARM;
                                ControlCommand cmd = { .target_state = STATE_ALARM, .cut_power = false };
                                if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);
                            }
                        }
                        break;
                    }

                    case MSG_HEARTBEAT: {
                        if (rxPacket.len == sizeof(HeartbeatData)) {
                            HeartbeatData hb;
                            memcpy(&hb, rxPacket.data, sizeof(HeartbeatData));
                            lastSensorHeartbeat = millis();
                            sensorConnected = true;
                        }
                        break;
                    }

                    case MSG_NACK: {
                        if (rxPacket.len == sizeof(NackData)) {
                            NackData nack;
                            memcpy(&nack, rxPacket.data, sizeof(NackData));
                            Serial.printf("[Gateway] Node B phản hồi NACK: Code=%u\n", nack.err_code);
                        }
                        break;
                    }

                    default:
                        send_nack(CommSerial, rxPacket.type, NACK_ERR_TYPE);
                        break;
                }
            }
        }

        // Kiểm tra mất kết nối Node B quá 3 giây
        if (sensorConnected && (millis() - lastSensorHeartbeat > 3000)) {
            sensorConnected = false;
            Serial.println("[Gateway] Cảnh báo: Mất kết nối Heartbeat với Node B (>3s)!");
        }

        // Gửi nhịp tim định kỳ 1s phản hồi sang Node B
        if (millis() - lastHbTx >= 1000) {
            lastHbTx = millis();
            HeartbeatData hb = {
                .state = static_cast<uint8_t>(currentState),
                .seq = ++hbSeq,
                .uptime = millis()
            };
            send_msg(CommSerial, MSG_HEARTBEAT, hb);
        }

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

// --- Task 2: Máy trạng thái và ràng buộc an toàn (Core 1) ---
void SafetyTask(void *pvParameters) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(100);
    uint32_t alarmStartTime = 0;

    for (;;) {
        float currentSpeed = 0.0f;
        if (xSemaphoreTake(telemetryMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
            currentSpeed = sharedTelemetry.speed;
            xSemaphoreGive(telemetryMutex);
        }

        switch (currentState) {
            case STATE_PARKED:
            case STATE_ARMED:
                alarmStartTime = 0;
                break;

            case STATE_ALARM:
                if (alarmStartTime == 0) {
                    alarmStartTime = millis();
                }

                // Cảnh báo quá 15s: Kiểm tra ràng buộc an toàn (v <= 0.5 km/h) trước khi ngắt rơ-le
                if (millis() - alarmStartTime > 15000) {
                    if (currentSpeed <= 0.5f) {
                        currentState = STATE_THEFT_LOCK;
                        alarmStartTime = 0;
                        Serial.println("[Safety Task] Tốc độ an toàn (v=0) -> Kích hoạt THEFT_LOCK (Ngắt rơ-le)!");

                        ControlCommand cmd = { .target_state = STATE_THEFT_LOCK, .cut_power = true };
                        if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);

                        CmdRelayData relayCmd = { .state = 0, .seq = 1 };
                        send_msg(CommSerial, MSG_CMD_RELAY, relayCmd);
                    } else {
                        Serial.printf("[Safety Block] Xe đang chuyển động (v=%.2f km/h) -> Hoãn ngắt nguồn!\n", currentSpeed);
                    }
                }
                break;

            case STATE_THEFT_LOCK:
                break;
        }

        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

// --- Task 3: Điều khiển ngoại vi Relay, Buzzer, LED (Core 1) ---
void ControlTask(void *pvParameters) {
    ControlCommand cmd;

    for (;;) {
        if (xQueueReceive(controlQueue, &cmd, pdMS_TO_TICKS(100)) == pdTRUE) {
            if (cmd.cut_power) {
                digitalWrite(PIN_RELAY, LOW);  // Ngắt nguồn
                Serial.println("[Control Task] Rơ-le -> NGẮT NGUỒN (POWER CUT)");
            } else {
                digitalWrite(PIN_RELAY, HIGH); // Cấp nguồn
                Serial.println("[Control Task] Rơ-le -> CẤP NGUỒN (POWER ON)");
            }
        }

        switch (currentState) {
            case STATE_PARKED:
                digitalWrite(PIN_LED, LOW);
                set_buzzer(false);
                break;

            case STATE_ARMED:
                digitalWrite(PIN_LED, (millis() / 1000) % 2); // Nháy chậm 1s
                set_buzzer(false);
                break;

            case STATE_ALARM:
                digitalWrite(PIN_LED, (millis() / 200) % 2);  // Nháy nhanh 200ms
                set_buzzer((millis() / 200) % 2);            // Còi hú dồn dập
                break;

            case STATE_THEFT_LOCK:
                digitalWrite(PIN_LED, HIGH);                 // Sáng cố định
                set_buzzer((millis() / 500) % 2);            // Còi ngắt quãng
                break;
        }

        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

// --- Task 4: Quản lý kết nối Wi-Fi & MQTT Client (Core 0) ---
void MQTTTask(void *pvParameters) {
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqtt_callback);

    uint32_t lastTelemetryPub = 0;
    uint32_t lastHeartbeatPub = 0;

    for (;;) {
        // 1. Quản lý kết nối Wi-Fi
        if (WiFi.status() != WL_CONNECTED) {
            if (strlen(WIFI_SSID) > 0 && strcmp(WIFI_SSID, "WIFI_NAME_HERE") != 0) {
                WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
                vTaskDelay(pdMS_TO_TICKS(3000));
            } else {
                vTaskDelay(pdMS_TO_TICKS(5000));
            }
        }

        // 2. Quản lý kết nối MQTT Broker kèm LWT (Last Will)
        if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
            char clientId[48];
            snprintf(clientId, sizeof(clientId), "Guardian-NodeA-%08X", (uint32_t)ESP.getEfuseMac());

            const char* willTopic = TOPIC_STATUS;
            const char* willMessage = "{\"status\":\"offline\",\"reason\":\"lwt_disconnect\"}";
            uint8_t willQos = 1;
            bool willRetain = true;

            if (mqttClient.connect(clientId, NULL, NULL, willTopic, willQos, willRetain, willMessage)) {
                Serial.println("[MQTT] Kết nối thành công tới Broker!");
                
                // Báo Online
                char onlineMsg[128];
                snprintf(onlineMsg, sizeof(onlineMsg), "{\"status\":\"online\",\"ip\":\"%s\",\"fw\":\"v1.0.0\"}",
                         WiFi.localIP().toString().c_str());
                mqttClient.publish(TOPIC_STATUS, onlineMsg, true);

                // Lắng nghe topic nhận lệnh (cả UUID lẫn Device ID)
                mqttClient.subscribe(TOPIC_CMD_SUB);
                mqttClient.subscribe("guardian/dev-550e8400-0001/cmd/#");

                // NFR-05: Ngay khi phục hồi mạng, xả toàn bộ bản tin lưu trữ trong Offline Buffer
                flush_offline_messages();
            } else {
                vTaskDelay(pdMS_TO_TICKS(4000));
            }
        }

        // 3. Tiếp nhận cảnh báo từ Sensor Node (KỂ CẢ KHI ĐANG MẤT MẠNG ĐỂ LƯU BUFFER)
        AccelEventData evt;
        if (alertMqttQueue != NULL && xQueueReceive(alertMqttQueue, &evt, 0) == pdTRUE) {
            const char* reason = (evt.event_type >= 2) ? "FALL_DETECTED" : "MOTION_WHILE_ARMED";
            const char* severity = (evt.event_type >= 2) ? "CRITICAL" : "HIGH";

            char alertJson[256];
            snprintf(alertJson, sizeof(alertJson),
                     "{\"device_id\":\"%s\",\"ts\":%lu,\"alert_id\":\"a%lu\",\"reason\":\"%s\",\"severity\":\"%s\",\"details\":\"Gia toc vuot nguong: %.2f m/s2\"}",
                     DEVICE_ID, (unsigned long)(millis() / 1000), (unsigned long)millis(), reason, severity, evt.value);
            
            // Tự động publish nếu có mạng, hoặc lưu vào Offline Buffer nếu đang mất mạng
            publish_or_buffer(TOPIC_ALERT, alertJson, 1);
        }

        // 4. Xử lý truyền nhận tin định kỳ khi có kết nối
        if (mqttClient.connected()) {
            mqttClient.loop();

            // Định kỳ 3s gửi Telemetry chuẩn hóa (đầy đủ accel_x, accel_y, accel_z và battery_v)
            if (millis() - lastTelemetryPub >= 3000) {
                lastTelemetryPub = millis();

                float spd = 0.0f, ax = 0.0f, ay = 0.0f, az = 0.0f;
                if (xSemaphoreTake(telemetryMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
                    spd = sharedTelemetry.speed;
                    ax = sharedTelemetry.ax; ay = sharedTelemetry.ay; az = sharedTelemetry.az;
                    xSemaphoreGive(telemetryMutex);
                }

                char telemJson[320];
                snprintf(telemJson, sizeof(telemJson),
                         "{\"device_id\":\"%s\",\"ts\":%lu,\"speed_kmh\":%.2f,\"state\":\"%s\","
                         "\"accel\":[%.2f,%.2f,%.2f],\"accel_x\":%.2f,\"accel_y\":%.2f,\"accel_z\":%.2f,\"battery_v\":12.6}",
                         DEVICE_ID, (unsigned long)(millis() / 1000), spd, state_to_string(currentState),
                         ax, ay, az, ax, ay, az);
                mqttClient.publish(TOPIC_TELEMETRY, telemJson);
            }

            // Định kỳ 15s gửi Heartbeat
            if (millis() - lastHeartbeatPub >= 15000) {
                lastHeartbeatPub = millis();
                char hbJson[160];
                snprintf(hbJson, sizeof(hbJson),
                         "{\"device_id\":\"%s\",\"status\":\"online\",\"heap\":%u,\"uptime\":%lu}",
                         DEVICE_ID, esp_get_free_heap_size(), (unsigned long)(millis() / 1000));
                mqttClient.publish(TOPIC_HEARTBEAT, hbJson);
            }
        }

        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

// --- Khởi tạo hệ thống ---
void setup() {
    Serial.begin(115200);
    delay(500);

    pinMode(PIN_RELAY, OUTPUT);
    pinMode(PIN_BUZZER, OUTPUT);
    pinMode(PIN_LED, OUTPUT);

    digitalWrite(PIN_RELAY, HIGH);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED, LOW);

    CommSerial.begin(UART_BAUD, SERIAL_8N1, RXD2, TXD2);

    Serial.println("\n--- ESP32 Gateway (Node A) Initializing ---");

    telemetryMutex  = xSemaphoreCreateMutex();
    controlQueue    = xQueueCreate(5, sizeof(ControlCommand));
    alertMqttQueue  = xQueueCreate(10, sizeof(AccelEventData));
    bufferMutex     = xSemaphoreCreateMutex();

    if (telemetryMutex == NULL || controlQueue == NULL || alertMqttQueue == NULL || bufferMutex == NULL) {
        Serial.println("[ERROR] Không thể tạo FreeRTOS primitives!");
        while (1) delay(1000);
    }

    // Khởi tạo các FreeRTOS Tasks
    xTaskCreatePinnedToCore(UARTRxTask,   "UARTRxTask",   4096, NULL, 3, NULL, 0);
    xTaskCreatePinnedToCore(SafetyTask,   "SafetyTask",   4096, NULL, 3, NULL, 1);
    xTaskCreatePinnedToCore(ControlTask,  "ControlTask",  3072, NULL, 2, NULL, 1);
    xTaskCreatePinnedToCore(MQTTTask,     "MQTTTask",     6144, NULL, 2, NULL, 0);

    Serial.printf("[Node A] Free Heap: %u bytes\n", esp_get_free_heap_size());
}

// --- Vòng lặp chính: Nhận phím điều khiển & In trạng thái định kỳ ---
void loop() {
    // Nhận phím điều khiển test nhanh từ Serial Monitor
    if (Serial.available()) {
        char ch = Serial.read();
        if (ch == '1' || ch == 'a' || ch == 'A') {
            currentState = STATE_ARMED;
            Serial.println("\n>>> Chế độ: ARMED (Bật chống trộm) <<<");
            ControlCommand cmd = { .target_state = STATE_ARMED, .cut_power = false };
            if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);
        } else if (ch == '2') {
            currentState = STATE_ALARM;
            Serial.println("\n>>> Chế độ: Test ALARM (Còi hú) <<<");
            ControlCommand cmd = { .target_state = STATE_ALARM, .cut_power = false };
            if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);
        } else if (ch == 'b' || ch == 'B') {
            Serial.println("\n>>> Test còi 500ms... <<<");
            set_buzzer(true);
            delay(500);
            set_buzzer(false);
        } else if (ch == '0' || ch == 'd' || ch == 'D') {
            currentState = STATE_PARKED;
            Serial.println("\n>>> Chế độ: PARKED (Mở khóa / Bình thường) <<<");
            ControlCommand cmd = { .target_state = STATE_PARKED, .cut_power = false };
            if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);
        } else if (ch == 'k' || ch == 'K') {
            Serial.println("\n>>> Lệnh: Khóa khẩn cấp (Emergency Lock)... <<<");
            float spd = 0.0f;
            if (xSemaphoreTake(telemetryMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
                spd = sharedTelemetry.speed;
                xSemaphoreGive(telemetryMutex);
            }
            if (spd <= 0.5f) {
                currentState = STATE_THEFT_LOCK;
                Serial.println("[Safety] Vận tốc an toàn -> Chấp nhận khóa xe, ngắt rơ-le.");
                ControlCommand cmd = { .target_state = STATE_THEFT_LOCK, .cut_power = true };
                if (controlQueue != NULL) xQueueSend(controlQueue, &cmd, 0);
            } else {
                Serial.printf("[Safety Reject] Xe đang chạy (v=%.2f km/h) -> Từ chối ngắt nguồn!\n", spd);
            }
        }
    }

    // In log giám sát định kỳ mỗi 3 giây
    static uint32_t lastLog = 0;
    if (millis() - lastLog >= 3000) {
        lastLog = millis();

        float spd = 0.0f, ax = 0.0f, ay = 0.0f, az = 0.0f;
        if (xSemaphoreTake(telemetryMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
            spd = sharedTelemetry.speed;
            ax = sharedTelemetry.ax;
            ay = sharedTelemetry.ay;
            az = sharedTelemetry.az;
            xSemaphoreGive(telemetryMutex);
        }

        Serial.printf("[Trạng thái] Mode: %s | Sensor: %s | WiFi: %s | Spd: %.2f km/h | Heap: %u B\n",
                      state_to_string(currentState),
                      sensorConnected ? "CONNECTED" : "DISCONNECTED",
                      WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED",
                      spd,
                      esp_get_free_heap_size());
    }

    vTaskDelay(pdMS_TO_TICKS(100));
}
