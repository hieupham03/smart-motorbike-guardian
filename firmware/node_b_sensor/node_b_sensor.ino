#include "uart_protocol.h"
#include <Wire.h>
#include "guardian_config.h"
#include "wheel_speed.h"
#include <TinyGPS++.h>
#include <math.h>

// --- Cấu hình phần cứng & Chân giao tiếp (Node B Sensor - ESP32-S3) ---
#define RXD1 18
#define TXD1 17
#define UART_BAUD 115200

#define PIN_I2C_SDA 8
#define PIN_I2C_SCL 9

#define PIN_HALL 4

HardwareSerial CommSerial(1);
HardwareSerial GpsSerial(2);
struct GpsSnapshot {float lat, lon; uint32_t lastFix; bool hasFix;};
static GpsSnapshot gpsSnapshot={};
static SemaphoreHandle_t gpsMutex;
static volatile uint32_t droppedSamples=0;


// --- Cấu trúc dữ liệu & Biến chia sẻ FreeRTOS ---
struct RawSensorSample {
    float raw_speed;
    float raw_ax, raw_ay, raw_az;
    uint32_t timestamp;
    uint32_t wheel_idle_ms;
    bool imu_valid;
    bool speed_valid;
};

static QueueHandle_t sensorQueue = NULL;
static QueueHandle_t eventQueue  = NULL;
static SemaphoreHandle_t telemMutex = NULL;

static TelemetryData latestTelemetry = { .speed = 0.0f, .ax = 0.0f, .ay = 0.0f, .az = 9.81f, .timestamp = 0 };

static volatile uint32_t lastGatewayHeartbeat = 0;
static volatile bool gatewayConnected = false;
static volatile uint8_t nodeState = 0;

static bool mpuDetected = false;
static uint8_t actualMpuAddr = 0x68;

// Biến đếm xung Hall (Ngắt ISR)
static volatile uint32_t hallPulseCount = 0;
static volatile uint32_t hallLastUs=0, hallPeriodUs=0;
static volatile uint32_t hallLastMs=0;
static portMUX_TYPE hallMux = portMUX_INITIALIZER_UNLOCKED;

void IRAM_ATTR hall_isr() {
    uint32_t now=micros();
    uint32_t nowMs=millis();
    portENTER_CRITICAL_ISR(&hallMux);
    if (!hallPulseCount || uint32_t(nowMs-hallLastMs)>=WHEEL_STOP_MS || uint32_t(now-hallLastUs)>=10000) {
        uint32_t elapsed = uint32_t(now-hallLastUs);
        hallPeriodUs = wheel_period_after_pulse(hallPulseCount != 0, uint32_t(nowMs-hallLastMs), elapsed);
        hallLastUs=now; hallLastMs=nowMs; ++hallPulseCount;
    }
    portEXIT_CRITICAL_ISR(&hallMux);
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
                if ((Wire.read() & 0x7E) != 0x68) continue;
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
    if(Wire.endTransmission()!=0) return false;
    delay(10);

    // Cấu hình dải đo gia tốc +/- 4g
    Wire.beginTransmission(actualMpuAddr);
    Wire.write(0x1C);
    Wire.write(0x08);
    return Wire.endTransmission()==0;
}

bool read_mpu6050(float &ax, float &ay, float &az) {
    if (!mpuDetected) return false;

    Wire.beginTransmission(actualMpuAddr);
    Wire.write(0x3B);
    if (Wire.endTransmission(false) != 0) return false;

    if (Wire.requestFrom((int)actualMpuAddr, 6) != 6) return false;

    int16_t raw[3];
    for (int i=0;i<3;++i) { uint8_t hi=Wire.read(),lo=Wire.read(); raw[i]=int16_t((uint16_t(hi)<<8)|lo); }
    int16_t raw_ax=raw[0],raw_ay=raw[1],raw_az=raw[2];

    const float SCALE_FACTOR = (9.80665f / 8192.0f);
    ax = raw_ax * SCALE_FACTOR;
    ay = raw_ay * SCALE_FACTOR;
    az = raw_az * SCALE_FACTOR;

    return true;
}

// --- Task 1: Thu thập dữ liệu cảm biến định kỳ 50ms (Core 1) ---
// Independent GPS task: only owner of UART2 and TinyGPSPlus.
void GpsTask(void*) {
    TinyGPSPlus gps; uint32_t lastLog=0;
    for (;;) {
        unsigned budget=512;
        while(budget-- && GpsSerial.available()) {
            gps.encode(char(GpsSerial.read()));
            if(gps.location.isUpdated() && gps.location.isValid()) {
                float lat=gps.location.lat(),lon=gps.location.lng();
                if(isfinite(lat)&&isfinite(lon)&&fabsf(lat)<=90&&fabsf(lon)<=180 &&
                   xSemaphoreTake(gpsMutex,pdMS_TO_TICKS(5))==pdTRUE) {
                    gpsSnapshot={lat,lon,millis(),true}; xSemaphoreGive(gpsMutex);
                }
            }
        }
        if(millis()-lastLog>=2000) {
            lastLog=millis(); GpsSnapshot g={};
            if(xSemaphoreTake(gpsMutex,pdMS_TO_TICKS(5))==pdTRUE) {g=gpsSnapshot;xSemaphoreGive(gpsMutex);}
            Serial.printf("[GPS %s] lat=%.6f lon=%.6f age=%lu chars=%lu checksum_errors=%lu\n",
                !g.hasFix?"NO_FIX":(millis()-g.lastFix<=GPS_STALE_MS?"FIX":"STALE"),g.lat,g.lon,
                (unsigned long)(g.hasFix?millis()-g.lastFix:UINT32_MAX),
                (unsigned long)gps.charsProcessed(),(unsigned long)gps.failedChecksum());
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}
void SensorTask(void*) {
    TickType_t wake=xTaskGetTickCount(); uint32_t retry=0,lastCount=0,lastPulseMs=0;
    for (;;) {
        uint32_t now=millis(),count,last,period,nowUs;
        portENTER_CRITICAL(&hallMux);
        count=hallPulseCount;last=hallLastUs;period=hallPeriodUs;nowUs=micros();
        portEXIT_CRITICAL(&hallMux);
        if(count!=lastCount) {lastCount=count;lastPulseMs=now-uint32_t(nowUs-last)/1000;}
        uint32_t idle=now-lastPulseMs; // millis avoids resurrecting motion after micros wraps (~71 min).
        WheelSpeedEstimate wheel = estimate_wheel_speed(period, uint32_t(nowUs-last), idle);
        float speed = wheel.kmh;
        float ax=NAN,ay=NAN,az=NAN;
        bool valid=mpuDetected && read_mpu6050(ax,ay,az);
        if(!valid) {
            mpuDetected=false;
            if(now-retry>=3000) {retry=now;mpuDetected=init_mpu6050();}
        }
        RawSensorSample s={speed,ax,ay,az,now,idle,valid,wheel.valid};
        if(xQueueSend(sensorQueue,&s,0)!=pdTRUE) ++droppedSamples;
        vTaskDelayUntil(&wake,pdMS_TO_TICKS(50));
    }
}

void ProcessingTask(void *pvParameters) {
    RawSensorSample sample;
    const float ACCEL_EVENT_THRESHOLD = 3.5f;   // Ngưỡng gia tốc động rung lắc
    const float TILT_FALL_THRESHOLD = 50.0f;    // Ngưỡng góc nghiêng đổ xe (50 độ)

    uint8_t consecutiveVibeCount = 0;           // Bộ đếm mẫu liên tiếp vượt ngưỡng (Debounce)
    uint32_t lastAlertTriggerTime = 0;          // Cooldown chống spam cảnh báo
    uint32_t tiltStartTime = 0;                 // Thời điểm bắt đầu nghiêng quá ngưỡng

    for (;;) {
        if (xQueueReceive(sensorQueue, &sample, portMAX_DELAY) == pdTRUE) {
            uint32_t now = millis();

            if (xSemaphoreTake(telemMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
                latestTelemetry.speed = sample.raw_speed;
                latestTelemetry.ax = sample.raw_ax;
                latestTelemetry.ay = sample.raw_ay;
                latestTelemetry.az = sample.raw_az;
                latestTelemetry.timestamp = sample.timestamp;
                latestTelemetry.wheel_idle_ms=sample.wheel_idle_ms;
                latestTelemetry.imu_valid=sample.imu_valid;
                latestTelemetry.speed_valid=sample.speed_valid;
                xSemaphoreGive(telemMutex);
            }

            if(!sample.imu_valid) {consecutiveVibeCount=0;tiltStartTime=0;continue;}
            // 1. Tính toán góc nghiêng (Tilt Angle)
            float tiltDeg = atan2(sqrt(sample.raw_ax * sample.raw_ax + sample.raw_ay * sample.raw_ay),
                                  sample.raw_az) * (180.0f / 3.14159265f);

            // 2. Thuật toán phát hiện Ngã xe thông minh (Phân biệt Ôm cua vs Ngã xe thật)
            // Xe ôm cua: Nghiêng nhưng tốc độ > 5 km/h và chỉ nghiêng tạm thời < 2 giây.
            // Ngã xe thật: Nghiêng > 50 độ KÈM theo xe dừng khựng (speed <= 2 km/h) HOẶC nghiêng liên tục > 2 giây.
            if (tiltDeg > TILT_FALL_THRESHOLD) {
                if (tiltStartTime == 0) {
                    tiltStartTime = now;
                }

                bool isRealCrash = (sample.speed_valid && sample.raw_speed <= 2.0f && (now - tiltStartTime >= 500)) ||
                                   (now - tiltStartTime >= 2000); // Nghiêng liên tục > 2s

                if (isRealCrash && (now - lastAlertTriggerTime >= 5000)) { // Cooldown 5s
                    lastAlertTriggerTime = now;
                    AccelEventData evt = {
                        .event_type = 2, // 2 = FALL_DETECTED (CRITICAL)
                        .value = tiltDeg,
                        .timestamp = now
                    };
                    if (eventQueue != NULL) {
                        xQueueSend(eventQueue, &evt, 0);
                    }
                    Serial.printf("[Node B] ⚠️ PHÁT HIỆN NGÃ XE THẬT: Nghiêng = %.1f độ, Vận tốc = %.1f km/h\n",
                                  tiltDeg, sample.raw_speed);
                }
            } else {
                tiltStartTime = 0; // Trở về góc thẳng đứng bình thường
            }

            // 3. Phát hiện gia tốc động vượt ngưỡng rung lắc (Kèm Debounce 3 mẫu liên tiếp & Cooldown 4s)
            float dynamicAccel = fabsf(sqrtf(sample.raw_ax*sample.raw_ax + sample.raw_ay*sample.raw_ay + sample.raw_az*sample.raw_az)-9.80665f);

            if (gatewayConnected && nodeState==1 && dynamicAccel > ACCEL_EVENT_THRESHOLD) {
                consecutiveVibeCount++;
                // Yêu cầu 3 mẫu liên tiếp vượt ngưỡng (chống nảy tiếp điểm, gió thổi hoặc va chạm nhẹ thoáng qua)
                if (consecutiveVibeCount >= 3) {
                    if (now - lastAlertTriggerTime >= 4000) { // Cooldown 4s chống spam alert
                        lastAlertTriggerTime = now;
                        AccelEventData evt = {
                            .event_type = 1, // 1 = MOTION_WHILE_ARMED (HIGH)
                            .value = dynamicAccel,
                            .timestamp = now
                        };
                        if (eventQueue != NULL) {
                            xQueueSend(eventQueue, &evt, 0);
                        }
                        Serial.printf("[Node B] Phát hiện rung lắc/cạy phá (Debounce OK): %.2f m/s2\n", dynamicAccel);
                    }
                    consecutiveVibeCount = 0;
                }
            } else {
                consecutiveVibeCount=0;
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
                GpsSnapshot g={};
                if(xSemaphoreTake(gpsMutex,pdMS_TO_TICKS(5))==pdTRUE) {g=gpsSnapshot;xSemaphoreGive(gpsMutex);}
                telemToSend.latitude=g.lat;telemToSend.longitude=g.lon;
                telemToSend.gps_age_ms=g.hasFix?millis()-g.lastFix:UINT32_MAX;
                telemToSend.gps_valid=g.hasFix && telemToSend.gps_age_ms<=GPS_STALE_MS;
                bool sampleFresh = sensor_sample_fresh(millis(), telemToSend.timestamp);
                telemToSend.speed_valid=telemToSend.speed_valid && sampleFresh;
                telemToSend.imu_valid=telemToSend.imu_valid && sampleFresh;
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
    GpsSerial.begin(GPS_BAUD,SERIAL_8N1,GPS_RX_PIN,GPS_TX_PIN);

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
    gpsMutex=xSemaphoreCreateMutex();

    if (sensorQueue == NULL || eventQueue == NULL || telemMutex == NULL || gpsMutex == NULL) {
        Serial.println("[ERROR] Không thể tạo FreeRTOS primitives!");
        while (1) delay(1000);
    }

    if(xTaskCreatePinnedToCore(GpsTask,"GPS",4096,NULL,1,NULL,0)!=pdPASS) {Serial.println("[FATAL] task creation failed"); while(true) delay(1000);}
    Serial.printf("[UART v2] payload=%u GPS RX=%d TX=%d baud=%lu\n",unsigned(sizeof(TelemetryData)),GPS_RX_PIN,GPS_TX_PIN,(unsigned long)GPS_BAUD);
    if(xTaskCreatePinnedToCore(SensorTask,     "SensorTask",     4096, NULL, 3, NULL, 1)!=pdPASS) {Serial.println("[FATAL] task creation failed"); while(true) delay(1000);}
    if(xTaskCreatePinnedToCore(ProcessingTask, "ProcessingTask", 4096, NULL, 2, NULL, 1)!=pdPASS) {Serial.println("[FATAL] task creation failed"); while(true) delay(1000);}
    if(xTaskCreatePinnedToCore(UARTTxRxTask,   "UARTTxRxTask",   4096, NULL, 2, NULL, 0)!=pdPASS) {Serial.println("[FATAL] task creation failed"); while(true) delay(1000);}

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
                      mpuDetected ? "REAL (I2C)" : "MISSING/INVALID",
                      gatewayConnected ? "CONNECTED" : "DISCONNECTED",
                      esp_get_free_heap_size());
    }
    vTaskDelay(pdMS_TO_TICKS(500));
}
