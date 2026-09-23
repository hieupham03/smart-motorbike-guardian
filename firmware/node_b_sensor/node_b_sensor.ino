#include "uart_protocol.h"
#include <Wire.h>
#include <esp_task_wdt.h>

// --- Cấu hình phần cứng & Chân giao tiếp (Node B Sensor - ESP32-S3) ---
#define RXD1 18
#define TXD1 17
#define UART_BAUD 115200

#define PIN_I2C_SDA 8
#define PIN_I2C_SCL 9

#define PIN_HALL 4
#define WHEEL_CIRCUMFERENCE_METERS 0.5f // Chu vi bánh xe (0.5m)
#define PULSES_PER_REV 1                // 1 nam châm = 1 xung/vòng

HardwareSerial CommSerial(1);

// --- Cấu trúc dữ liệu & Biến chia sẻ FreeRTOS ---
struct RawSensorSample {
    float raw_speed;
    float raw_ax, raw_ay, raw_az;
    uint32_t timestamp;
};

static QueueHandle_t sensorQueue = NULL;
static QueueHandle_t eventQueue  = NULL;
static SemaphoreHandle_t telemMutex = NULL;

static TelemetryData latestTelemetry = { .speed = 0.0f, .ax = 0.0f, .ay = 0.0f, .az = 9.81f, .timestamp = 0 };

static volatile uint32_t lastGatewayHeartbeat = 0;
static volatile bool gatewayConnected = false;
static uint8_t nodeState = 0;

static bool mpuDetected = false;
static uint8_t actualMpuAddr = 0x68;

// Biến đếm xung Hall (Ngắt ISR)
static volatile uint32_t hallPulseCount = 0;
static portMUX_TYPE hallMux = portMUX_INITIALIZER_UNLOCKED;

void IRAM_ATTR hall_isr() {
    static uint32_t lastPulseTime = 0;
    uint32_t now = millis();
    if (now - lastPulseTime >= 10) { // Debounce 10ms
        lastPulseTime = now;
        portENTER_CRITICAL_ISR(&hallMux);
        hallPulseCount++;
        portEXIT_CRITICAL_ISR(&hallMux);
    }
}

// --- Khởi tạo và đọc I2C cảm biến MPU-6050 ---
bool init_mpu6050() {
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 100000);
    Wire.setTimeOut(25);
    delay(50);

    // Quét địa chỉ 0x68 và 0x69
    uint8_t addrs[2] = {0x68, 0x69};
    bool found = false;

    for (int i = 0; i < 2; i++) {
        Wire.beginTransmission(addrs[i]);
        Wire.write(0x75); // WHO_AM_I
        if (Wire.endTransmission() == 0) {
            Wire.requestFrom((int)addrs[i], 1);
            if (Wire.available()) {
                Wire.read();
                actualMpuAddr = addrs[i];
                found = true;
                break;
            }
        }
    }

    if (!found) return false;

    // Đánh thức MPU-6050
    Wire.beginTransmission(actualMpuAddr);
    Wire.write(0x6B);
    Wire.write(0x00);
    Wire.endTransmission();
    delay(10);

    // Cấu hình dải đo gia tốc +/- 4g
    Wire.beginTransmission(actualMpuAddr);
    Wire.write(0x1C);
    Wire.write(0x08);
    Wire.endTransmission();

    return true;
}

bool read_mpu6050(float &ax, float &ay, float &az) {
    if (!mpuDetected) return false;

    Wire.beginTransmission(actualMpuAddr);
    Wire.write(0x3B);
    if (Wire.endTransmission(false) != 0) return false;

    if (Wire.requestFrom((int)actualMpuAddr, 6) != 6) return false;

    int16_t raw_ax = (Wire.read() << 8) | Wire.read();
    int16_t raw_ay = (Wire.read() << 8) | Wire.read();
    int16_t raw_az = (Wire.read() << 8) | Wire.read();

    const float SCALE_FACTOR = (9.80665f / 8192.0f);
    ax = raw_ax * SCALE_FACTOR;
    ay = raw_ay * SCALE_FACTOR;
    az = raw_az * SCALE_FACTOR;

    return true;
}

// --- Task 1: Thu thập dữ liệu cảm biến định kỳ 50ms (Core 1) ---
void SensorTask(void *pvParameters) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(50);

    uint32_t lastSpeedCalcTime = millis();
    uint32_t lastPulseSample = 0;
    float currentSpeed = 0.0f;
    float simAngle = 0.0f;

    for (;;) {
        uint32_t now = millis();

        // Tính tốc độ từ cảm biến Hall mỗi 200ms
        if (now - lastSpeedCalcTime >= 200) {
            uint32_t currentPulses = 0;
            portENTER_CRITICAL(&hallMux);
            currentPulses = hallPulseCount;
            portEXIT_CRITICAL(&hallMux);

            uint32_t deltaPulses = currentPulses - lastPulseSample;
            lastPulseSample = currentPulses;

            float dtSeconds = (now - lastSpeedCalcTime) / 1000.0f;
            lastSpeedCalcTime = now;

            if (dtSeconds > 0.0f) {
                float speed_mps = ((float)deltaPulses / (float)PULSES_PER_REV) * WHEEL_CIRCUMFERENCE_METERS / dtSeconds;
                currentSpeed = speed_mps * 3.6f;
                if (currentSpeed > 120.0f) currentSpeed = 120.0f;
            }
        }

        // Đọc gia tốc từ MPU-6050
        float ax = 0.0f, ay = 0.0f, az = 9.81f;
        if (mpuDetected) {
            read_mpu6050(ax, ay, az);
        } else {
            // Tự động quét lại I2C mỗi 3 giây nếu chưa kết nối
            static uint32_t lastMpuRetry = 0;
            if (now - lastMpuRetry >= 3000) {
                lastMpuRetry = now;
                if (init_mpu6050()) {
                    mpuDetected = true;
                    Serial.println("\n>>> [Node B] Đã phát hiện MPU-6050 I2C! <<<");
                }
            }

            simAngle += 0.05f;
            ax = 0.1f * sin(simAngle);
            ay = 0.1f * cos(simAngle);
            az = 9.81f + 0.05f * sin(simAngle * 2.0f);
        }

        RawSensorSample sample = {
            .raw_speed = currentSpeed,
            .raw_ax = ax,
            .raw_ay = ay,
            .raw_az = az,
            .timestamp = now
        };

        if (sensorQueue != NULL) {
            xQueueSend(sensorQueue, &sample, pdMS_TO_TICKS(10));
        }

        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

// --- Task 2: Xử lý dữ liệu và phát hiện va chạm / trộm (Core 1) ---
void ProcessingTask(void *pvParameters) {
    RawSensorSample sample;
    const float ACCEL_EVENT_THRESHOLD = 3.5f;

    for (;;) {
        if (xQueueReceive(sensorQueue, &sample, portMAX_DELAY) == pdTRUE) {
            if (xSemaphoreTake(telemMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
                latestTelemetry.speed = sample.raw_speed;
                latestTelemetry.ax = sample.raw_ax;
                latestTelemetry.ay = sample.raw_ay;
                latestTelemetry.az = sample.raw_az;
                latestTelemetry.timestamp = sample.timestamp;
                xSemaphoreGive(telemMutex);
            }

            // Phát hiện gia tốc động vượt ngưỡng rung lắc
            float dynamicAccel = sqrt(sample.raw_ax * sample.raw_ax + 
                                      sample.raw_ay * sample.raw_ay + 
                                      (sample.raw_az - 9.81f) * (sample.raw_az - 9.81f));

            if (dynamicAccel > ACCEL_EVENT_THRESHOLD) {
                AccelEventData evt = {
                    .event_type = 1,
                    .value = dynamicAccel,
                    .timestamp = millis()
                };
                if (eventQueue != NULL) {
                    xQueueSend(eventQueue, &evt, 0);
                }
                Serial.printf("[Node B] Phát hiện rung/va chạm: %.2f m/s2\n", dynamicAccel);
            }
        }
    }
}

// --- Task 3: Giao tiếp UART 2 chiều với Node A (Core 0) ---
void UARTTxRxTask(void *pvParameters) {
    UartPacket rxPacket;
    uint32_t lastTelemetryTx = 0;
    uint32_t lastHeartbeatTx = 0;
    uint8_t hbSeq = 0;

    for (;;) {
        // Đọc gói tin từ Node A
        while (CommSerial.available()) {
            uint8_t b = CommSerial.read();
            if (parse_byte(b, rxPacket)) {
                switch (rxPacket.type) {
                    case MSG_HEARTBEAT: {
                        if (rxPacket.len == sizeof(HeartbeatData)) {
                            HeartbeatData hb;
                            memcpy(&hb, rxPacket.data, sizeof(HeartbeatData));
                            lastGatewayHeartbeat = millis();
                            gatewayConnected = true;
                            nodeState = hb.state;
                        }
                        break;
                    }

                    case MSG_CMD_RELAY: {
                        if (rxPacket.len == sizeof(CmdRelayData)) {
                            CmdRelayData cmd;
                            memcpy(&cmd, rxPacket.data, sizeof(CmdRelayData));
                            Serial.printf("[Node B] Lệnh Relay -> %s\n", cmd.state == 1 ? "ON" : "CUT");
                        }
                        break;
                    }

                    case MSG_NACK: {
                        if (rxPacket.len == sizeof(NackData)) {
                            NackData nack;
                            memcpy(&nack, rxPacket.data, sizeof(NackData));
                            Serial.printf("[Node B] Nhận NACK từ Node A: Code=%u\n", nack.err_code);
                        }
                        break;
                    }

                    default:
                        send_nack(CommSerial, rxPacket.type, NACK_ERR_TYPE);
                        break;
                }
            }
        }

        // Kiểm tra mất kết nối Heartbeat quá 3s
        if (gatewayConnected && (millis() - lastGatewayHeartbeat > 3000)) {
            gatewayConnected = false;
            Serial.println("[Node B] Cảnh báo: Mất kết nối Heartbeat với Node A (>3s)!");
        }

        // Ưu tiên gửi sự kiện khẩn cấp
        AccelEventData evt;
        if (eventQueue != NULL && xQueueReceive(eventQueue, &evt, 0) == pdTRUE) {
            send_msg(CommSerial, MSG_ACCEL_EVENT, evt);
        }

        // Gửi Telemetry định kỳ 500ms
        if (millis() - lastTelemetryTx >= 500) {
            lastTelemetryTx = millis();
            TelemetryData telemToSend;
            if (xSemaphoreTake(telemMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
                telemToSend = latestTelemetry;
                xSemaphoreGive(telemMutex);
                send_msg(CommSerial, MSG_TELEMETRY, telemToSend);
            }
        }

        // Gửi Heartbeat định kỳ 1000ms
        if (millis() - lastHeartbeatTx >= 1000) {
            lastHeartbeatTx = millis();
            HeartbeatData hb = {
                .state = nodeState,
                .seq = ++hbSeq,
                .uptime = millis()
            };
            send_msg(CommSerial, MSG_HEARTBEAT, hb);
        }

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

// --- Khởi tạo hệ thống ---
void setup() {
    Serial.begin(115200);
    uint32_t startWait = millis();
    while (!Serial && (millis() - startWait < 2000)) {
        delay(10);
    }
    delay(200);

    CommSerial.begin(UART_BAUD, SERIAL_8N1, RXD1, TXD1);

    Serial.println("\n--- ESP32-S3 Sensor Node (Node B) Initializing ---");

    pinMode(PIN_HALL, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(PIN_HALL), hall_isr, FALLING);

    mpuDetected = init_mpu6050();
    if (mpuDetected) {
        Serial.println("[Node B] Khởi tạo MPU-6050 I2C thành công!");
    } else {
        Serial.println("[Node B] Chưa cắm MPU-6050, đang chạy chế độ dự phòng.");
    }

    sensorQueue = xQueueCreate(10, sizeof(RawSensorSample));
    eventQueue  = xQueueCreate(5, sizeof(AccelEventData));
    telemMutex  = xSemaphoreCreateMutex();

    if (sensorQueue == NULL || eventQueue == NULL || telemMutex == NULL) {
        Serial.println("[ERROR] Không thể tạo FreeRTOS primitives!");
        while (1) delay(1000);
    }

    xTaskCreatePinnedToCore(SensorTask,     "SensorTask",     4096, NULL, 3, NULL, 1);
    xTaskCreatePinnedToCore(ProcessingTask, "ProcessingTask", 4096, NULL, 2, NULL, 1);
    xTaskCreatePinnedToCore(UARTTxRxTask,   "UARTTxRxTask",   4096, NULL, 2, NULL, 0);

    Serial.printf("[Node B] Free Heap: %u bytes\n", esp_get_free_heap_size());
}

// --- Vòng lặp chính: In log định kỳ ---
void loop() {
    static uint32_t lastHealthLog = 0;
    if (millis() - lastHealthLog >= 5000) {
        lastHealthLog = millis();
        
        float spd = 0.0f, ax = 0.0f, ay = 0.0f, az = 0.0f;
        if (xSemaphoreTake(telemMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
            spd = latestTelemetry.speed;
            ax = latestTelemetry.ax;
            ay = latestTelemetry.ay;
            az = latestTelemetry.az;
            xSemaphoreGive(telemMutex);
        }

        Serial.printf("[Node B Live] Tốc độ: %.2f km/h | Accel: [%.2f, %.2f, %.2f] | MPU: %s | Node A: %s | Heap: %u B\n",
                      spd, ax, ay, az,
                      mpuDetected ? "REAL (I2C)" : "FALLBACK",
                      gatewayConnected ? "CONNECTED" : "DISCONNECTED",
                      esp_get_free_heap_size());
    }
    vTaskDelay(pdMS_TO_TICKS(500));
}
