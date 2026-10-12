#include "uart_protocol.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include "guardian_config.h"
#include <ArduinoJson.h>
#include <math.h>

// --- Cấu hình Wi-Fi & MQTT Broker ---
#include "network_config.h"

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

enum Action : uint8_t {ACTION_ARM,ACTION_DISARM,ACTION_LOCK,ACTION_UNLOCK,ACTION_SIREN_ON,ACTION_SIREN_OFF,ACTION_REBOOT,ACTION_ALARM};
struct ControlCommand {Action action; char id[40]; bool remote;};
struct CommandResult {char id[40]; bool executed; char reason[40]; bool reboot;};
static QueueHandle_t resultQueue;
static uint32_t telemetryReceived=0;
static bool telemetrySeen=false;
static uint32_t bootNonce;


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
    if(!mqttClient.connected() || xSemaphoreTake(bufferMutex,pdMS_TO_TICKS(10))!=pdTRUE) return;
    if(offlineCount) {
        BufferedMqttMessage &msg=offlineBuffer[offlineTail];
        if(!msg.is_valid || mqttClient.publish(msg.topic,msg.payload)) {
            msg.is_valid=false;offlineTail=(offlineTail+1)%OFFLINE_BUFFER_CAPACITY;--offlineCount;
        }
    }
    xSemaphoreGive(bufferMutex);
}

void publish_or_buffer(const char* topic, const char* payload, uint8_t qos = 1) {
    if (mqttClient.connected()) {
        if(!mqttClient.publish(topic,payload)) enqueue_offline_message(topic,payload,qos);
    } else {
        Serial.printf("[Offline Buffer] Mat song mang -> Luu vao Buffer RAM (Slot %u/%u)\n", offlineCount + 1, OFFLINE_BUFFER_CAPACITY);
        enqueue_offline_message(topic, payload, qos);
    }
}

// --- Hàm điều khiển còi báo động ---

// --- Callback MQTT: Xử lý lệnh điều khiển từ xa ---
void set_motor(bool power) {digitalWrite(PIN_RELAY,(power==RELAY_ACTIVE_LOW)?LOW:HIGH);}
bool get_snapshot(TelemetryData &t,uint32_t &received) {
    if(xSemaphoreTake(telemetryMutex,pdMS_TO_TICKS(10))!=pdTRUE) return false;
    t=sharedTelemetry;received=telemetryReceived;bool seen=telemetrySeen;
    xSemaphoreGive(telemetryMutex);return seen;
}
const char *lock_block_reason() {
    TelemetryData t;uint32_t received;
    if(!get_snapshot(t,received)) return "NO_SENSOR_DATA";
    if(!sensorConnected || millis()-lastSensorHeartbeat>3000 || millis()-received>SENSOR_STALE_MS) return "SENSOR_STALE";
    if(!t.speed_valid||!isfinite(t.speed)||t.speed<0) return "SPEED_INVALID";
    if(t.speed>0.5f||t.wheel_idle_ms<WHEEL_STOP_MS) return "SPEED_NOT_ZERO";
    return nullptr;
}
void mqtt_callback(char* topic,byte* payload,unsigned length) {
    const char *suffix=strrchr(topic,'/');
    if(!suffix||strcmp(suffix,"/ack")==0) return; // Never acknowledge ACK.
    if(length>384) return;
    StaticJsonDocument<512> doc;
    if(deserializeJson(doc,payload,length)) return;
    const char *id=doc["cmd_id"]|"",*type=doc["type"]|"";
    if(!id[0]||strlen(id)>=40) return;
    for(const char *p=id;*p;++p) if(!(isalnum((unsigned char)*p)||*p=='-'||*p=='_')) return;
    struct Map {const char *type,*suffix;Action action;};
    static const Map maps[]={{"ARM","/arm",ACTION_ARM},{"DISARM","/disarm",ACTION_DISARM},
        {"LOCK_ENGINE","/lock_engine",ACTION_LOCK},{"UNLOCK_ENGINE","/unlock_engine",ACTION_UNLOCK},
        {"SIREN_ON","/siren_on",ACTION_SIREN_ON},{"SIREN_OFF","/siren_off",ACTION_SIREN_OFF},{"REBOOT","/reboot",ACTION_REBOOT}};
    for(const auto &m:maps) if(strcmp(type,m.type)==0 && strcmp(suffix,m.suffix)==0) {
        ControlCommand c={};c.action=m.action;c.remote=true;strlcpy(c.id,id,sizeof(c.id));
        if(xQueueSend(controlQueue,&c,0)==pdTRUE) return;
        char json[160];snprintf(json,sizeof(json),"{\"cmd_id\":\"%s\",\"result\":\"REJECTED\",\"reason_if_failed\":\"QUEUE_FULL\"}",id);
        mqttClient.publish(TOPIC_CMD_ACK,json);return;
    }
    char json[176];snprintf(json,sizeof(json),"{\"cmd_id\":\"%s\",\"result\":\"REJECTED\",\"reason_if_failed\":\"UNSUPPORTED_COMMAND\"}",id);
    mqttClient.publish(TOPIC_CMD_ACK,json);
}

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
                                TelemetryData incoming;memcpy(&incoming,rxPacket.data,sizeof(incoming));
                                if(isfinite(incoming.speed)&&incoming.speed>=0&&incoming.speed<=120) {
                                    sharedTelemetry=incoming;telemetryReceived=millis();telemetrySeen=true;
                                }
                                xSemaphoreGive(telemetryMutex);
                            }
                        }
                        break;
                    }

                    case MSG_ACCEL_EVENT: {
                        if (rxPacket.len == sizeof(AccelEventData)) {
                            AccelEventData evt;
                            memcpy(&evt, rxPacket.data, sizeof(AccelEventData));
                            if(!isfinite(evt.value)||evt.event_type<1||evt.event_type>2||(evt.event_type==1&&currentState!=STATE_ARMED)) break;
                            Serial.printf("[Gateway] Event type=%u value=%.2f %s\n", evt.event_type, evt.value, evt.event_type==2?"deg":"m/s2");

                            // Đẩy vào Queue gửi cảnh báo ngay lên MQTT
                            if (alertMqttQueue != NULL) {
                                xQueueSend(alertMqttQueue, &evt, 0);
                            }

                            // Kích hoạt báo động nếu xe đang ở chế độ ARMED
                            if (currentState == STATE_ARMED) {
                                ControlCommand cmd={};cmd.action=ACTION_ALARM;
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
void ControlTask(void*) {
    ControlCommand c;CommandResult cache[8]={};uint8_t head=0;
    uint32_t alarmStart=0;bool manualSiren=false;
    for(;;) {
        if(uxQueueSpacesAvailable(resultQueue)>0 && xQueueReceive(controlQueue,&c,pdMS_TO_TICKS(20))==pdTRUE) {
            bool duplicate=false;
            if(c.remote) for(const auto &r:cache) if(r.id[0]&&strcmp(r.id,c.id)==0) {xQueueSend(resultQueue,&r,0);duplicate=true;break;}
            if(!duplicate) {
                CommandResult r={};strlcpy(r.id,c.id,sizeof(r.id));r.executed=true;
                const char *reason=(c.action==ACTION_LOCK||c.action==ACTION_REBOOT)?lock_block_reason():nullptr;
                if(reason) {r.executed=false;strlcpy(r.reason,reason,sizeof(r.reason));}
                else switch(c.action) {
                    case ACTION_ARM:currentState=STATE_ARMED;manualSiren=false;set_motor(true);break;
                    case ACTION_DISARM:case ACTION_UNLOCK:currentState=STATE_PARKED;manualSiren=false;set_motor(true);break;
                    case ACTION_LOCK:currentState=STATE_THEFT_LOCK;set_motor(false);break;
                    case ACTION_SIREN_ON:manualSiren=true;break;
                    case ACTION_SIREN_OFF:manualSiren=false;if(currentState==STATE_ALARM)currentState=STATE_ARMED;break;
                    case ACTION_ALARM:if(currentState==STATE_ARMED)currentState=STATE_ALARM;break;
                    case ACTION_REBOOT:r.reboot=true;break;
                }
                digitalWrite(PIN_BUZZER,(manualSiren||currentState==STATE_ALARM||currentState==STATE_THEFT_LOCK)?HIGH:LOW);
                Serial.printf("[CONTROL] cmd=%s action=%u result=%s reason=%s state=%s\n",c.id,unsigned(c.action),r.executed?"EXECUTED":"REJECTED",r.reason,state_to_string(currentState));
                if(c.remote) {cache[head]=r;head=(head+1)%8;xQueueSend(resultQueue,&r,0);}
            }
        }
        if(currentState==STATE_ALARM) {
            if(!alarmStart)alarmStart=millis();
            if(millis()-alarmStart>=15000&&!lock_block_reason()) {set_motor(false);currentState=STATE_THEFT_LOCK;Serial.println("[CONTROL] automatic lock");}
        } else alarmStart=0;
        digitalWrite(PIN_BUZZER,(manualSiren||(currentState==STATE_ALARM&&(millis()/200)%2)||(currentState==STATE_THEFT_LOCK&&(millis()/500)%2))?HIGH:LOW);
        digitalWrite(PIN_LED,(currentState==STATE_THEFT_LOCK||(currentState==STATE_ARMED&&(millis()/1000)%2)||(currentState==STATE_ALARM&&(millis()/200)%2))?HIGH:LOW);
        vTaskDelay(pdMS_TO_TICKS(20));
    }
}

void MQTTTask(void *pvParameters) {
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqtt_callback);
    if(!mqttClient.setBufferSize(768)) Serial.println("[MQTT] buffer allocation failed");
    mqttClient.setSocketTimeout(1);
    CommandResult pendingAck={};bool hasAck=false;

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
                snprintf(onlineMsg, sizeof(onlineMsg), "{\"status\":\"online\",\"ip\":\"%s\",\"fw\":\"v2-gps\"}",
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

            char alertJson[320];
            snprintf(alertJson, sizeof(alertJson),
                     "{\"device_id\":\"%s\",\"ts\":%lu,\"alert_id\":\"a%08lx-%lu\",\"reason\":\"%s\",\"severity\":\"%s\",\"details\":\"Sensor event: %.2f %s\"}",
                     DEVICE_ID, (unsigned long)(millis() / 1000), (unsigned long)bootNonce, (unsigned long)evt.timestamp, reason, severity, evt.value, evt.event_type==2?"deg":"m/s2");

            // Tự động publish nếu có mạng, hoặc lưu vào Offline Buffer nếu đang mất mạng
            publish_or_buffer(TOPIC_ALERT, alertJson, 1);
        }

        // 4. Xử lý truyền nhận tin định kỳ khi có kết nối
        if (mqttClient.connected()) {
            mqttClient.loop();
            flush_offline_messages();
            if(!hasAck) hasAck=xQueueReceive(resultQueue,&pendingAck,0)==pdTRUE;
            if(hasAck) {
                StaticJsonDocument<256> doc;doc["cmd_id"]=pendingAck.id;doc["result"]=pendingAck.executed?"EXECUTED":"REJECTED";
                if(pendingAck.reason[0])doc["reason_if_failed"]=pendingAck.reason;else doc["reason_if_failed"]=nullptr;
                doc["ts"]=millis()/1000;char json[320];serializeJson(doc,json,sizeof(json));
                if(mqttClient.publish(TOPIC_CMD_ACK,json)) {hasAck=false;if(pendingAck.reboot){delay(200);ESP.restart();}}
            }

            // Định kỳ 3s gửi Telemetry chuẩn hóa (đầy đủ accel_x, accel_y, accel_z và battery_v)
            if (millis() - lastTelemetryPub >= 1000) {
                lastTelemetryPub = millis();

                TelemetryData t={};uint32_t received=0;
                bool seen=get_snapshot(t,received);uint32_t age=seen?millis()-received:UINT32_MAX;
                bool fresh=seen&&age<=SENSOR_STALE_MS&&sensorConnected&&millis()-lastSensorHeartbeat<=3000;
                uint32_t gpsAge=t.gps_age_ms;
                if(seen&&gpsAge!=UINT32_MAX)gpsAge=age>UINT32_MAX-gpsAge?UINT32_MAX:gpsAge+age;
                bool gpsValid=fresh&&t.gps_valid&&gpsAge<=GPS_STALE_MS&&isfinite(t.latitude)&&isfinite(t.longitude)&&fabsf(t.latitude)<=90&&fabsf(t.longitude)<=180;
                StaticJsonDocument<640> doc;
                doc["device_id"]=DEVICE_ID;doc["ts"]=millis()/1000;doc["state"]=state_to_string(currentState);
                doc["data_source"]="HARDWARE";doc["sensor_connected"]=fresh;doc["imu_valid"]=fresh&&t.imu_valid;
                doc["speed_valid"]=fresh&&t.speed_valid;doc["gps_valid"]=gpsValid;doc["gps_age_ms"]=seen?gpsAge:UINT32_MAX;
                if(fresh&&t.speed_valid)doc["speed_kmh"]=t.speed;
                if(fresh&&t.imu_valid&&isfinite(t.ax)&&isfinite(t.ay)&&isfinite(t.az)) {doc["accel_x"]=t.ax;doc["accel_y"]=t.ay;doc["accel_z"]=t.az;}
                if(gpsValid) {doc["latitude"]=t.latitude;doc["longitude"]=t.longitude;}
                // No battery ADC yet: do not publish fabricated 12.6V.
                char json[640];size_t len=serializeJson(doc,json,sizeof(json));
                if(doc.overflowed()||len>=sizeof(json)-1||!mqttClient.publish(TOPIC_TELEMETRY,json)) Serial.println("[MQTT] telemetry publish failed");
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

    digitalWrite(PIN_RELAY,(RELAY_POWER_ON_AT_BOOT==RELAY_ACTIVE_LOW)?LOW:HIGH);
    pinMode(PIN_RELAY, OUTPUT);
    pinMode(PIN_BUZZER, OUTPUT);
    pinMode(PIN_LED, OUTPUT);

    set_motor(RELAY_POWER_ON_AT_BOOT);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED, LOW);

    CommSerial.begin(UART_BAUD, SERIAL_8N1, RXD2, TXD2);

    Serial.println("\n--- ESP32 Gateway (Node A) Initializing ---");

    telemetryMutex  = xSemaphoreCreateMutex();
    controlQueue    = xQueueCreate(5, sizeof(ControlCommand));
    alertMqttQueue  = xQueueCreate(10, sizeof(AccelEventData));
    bufferMutex     = xSemaphoreCreateMutex();
    resultQueue=xQueueCreate(8,sizeof(CommandResult));
    bootNonce=esp_random();

    if (telemetryMutex == NULL || controlQueue == NULL || alertMqttQueue == NULL || bufferMutex == NULL || resultQueue == NULL) {
        Serial.println("[ERROR] Không thể tạo FreeRTOS primitives!");
        while (1) delay(1000);
    }

    // Khởi tạo các FreeRTOS Tasks
    if(xTaskCreatePinnedToCore(UARTRxTask,   "UARTRxTask",   4096, NULL, 3, NULL, 0)!=pdPASS) {Serial.println("[FATAL] task creation failed"); while(true) delay(1000);}
    if(xTaskCreatePinnedToCore(ControlTask,  "ControlTask",  6144, NULL, 2, NULL, 1)!=pdPASS) {Serial.println("[FATAL] task creation failed"); while(true) delay(1000);}
    if(xTaskCreatePinnedToCore(MQTTTask,     "MQTTTask",     8192, NULL, 2, NULL, 0)!=pdPASS) {Serial.println("[FATAL] task creation failed"); while(true) delay(1000);}

    Serial.printf("[Node A] Free Heap: %u bytes\n", esp_get_free_heap_size());
}

// --- Vòng lặp chính: Nhận phím điều khiển & In trạng thái định kỳ ---
void loop() {
    if(Serial.available()) {
        char ch=Serial.read();ControlCommand c={};bool known=true;
        switch(ch) {case 'a':case 'A':case '1':c.action=ACTION_ARM;break;
            case 'd':case 'D':case '0':c.action=ACTION_DISARM;break;
            case 'k':case 'K':c.action=ACTION_LOCK;break;case 'u':case 'U':c.action=ACTION_UNLOCK;break;
            case 'b':case '2':c.action=ACTION_SIREN_ON;break;case 's':c.action=ACTION_SIREN_OFF;break;default:known=false;}
        if(known&&xQueueSend(controlQueue,&c,0)!=pdTRUE)Serial.println("[CONTROL] queue full");
    }
    static uint32_t log=0;
    if(millis()-log>=3000) {
        log=millis();TelemetryData t={};uint32_t received=0;bool seen=get_snapshot(t,received);
        Serial.printf("[Node A UART v2] size=%u state=%s speed=%.2f fresh=%u gps_valid=%u age=%lu heap=%u\n",
            unsigned(sizeof(TelemetryData)),state_to_string(currentState),t.speed,
            seen&&millis()-received<=SENSOR_STALE_MS,t.gps_valid,(unsigned long)t.gps_age_ms,esp_get_free_heap_size());
    }
    vTaskDelay(pdMS_TO_TICKS(20));
}
