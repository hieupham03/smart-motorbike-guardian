#ifndef UART_PROTOCOL_H
#define UART_PROTOCOL_H

#include <Arduino.h>
#include <stdint.h>
#include <string.h>

// --- Cấu hình khung truyền: [START] [TYPE] [LEN] [DATA...] [CHECKSUM] ---
#define FRAME_START_BYTE    0xAA
#define MAX_PAYLOAD_LEN     128
#define FRAME_TIMEOUT_MS    50

// --- Các loại bản tin ---
enum MsgType : uint8_t {
    MSG_TELEMETRY   = 0x01,  // Dữ liệu cảm biến định kỳ
    MSG_ACCEL_EVENT = 0x02,  // Sự kiện rung lắc / ngã xe
    MSG_CMD_RELAY   = 0x03,  // Lệnh điều khiển rơ-le
    MSG_HEARTBEAT   = 0x04,  // Nhịp tim kiểm tra kết nối
    MSG_NACK        = 0x05   // Báo lỗi khung nhận
};

// --- Mã lỗi NACK ---
enum NackError : uint8_t {
    NACK_ERR_CHECKSUM = 0x01,
    NACK_ERR_LEN      = 0x02,
    NACK_ERR_TIMEOUT  = 0x03,
    NACK_ERR_TYPE     = 0x04
};

// --- Cấu trúc dữ liệu bản tin ---
#pragma pack(push, 1)

struct TelemetryData {
    float speed;             // Vận tốc (km/h)
    float ax, ay, az;        // Gia tốc 3 trục (m/s2)
    uint32_t timestamp;      // Thời gian lấy mẫu (ms)
};

struct AccelEventData {
    uint8_t event_type;      // 1: Rung lắc, 2: Nghiêng, 3: Va chạm
    float value;             // Cường độ gia tốc (m/s2)
    uint32_t timestamp;      // Thời gian phát hiện (ms)
};

struct CmdRelayData {
    uint8_t state;           // 0: Cắt nguồn, 1: Cấp nguồn
    uint8_t seq;             // Số thứ tự lệnh
};

struct HeartbeatData {
    uint8_t state;           // Trạng thái xe (0: PARKED, 1: ARMED, 2: ALARM, 3: LOCK)
    uint8_t seq;             // Số thứ tự heartbeat
    uint32_t uptime;         // Uptime (ms)
};

struct NackData {
    uint8_t err_code;        // Mã lỗi (NackError)
    uint8_t bad_type;        // MsgType gây lỗi
};

#pragma pack(pop)

// Cấu trúc gói tin sau khi giải mã
struct UartPacket {
    uint8_t type;
    uint8_t len;
    uint8_t data[MAX_PAYLOAD_LEN];
};

// --- Hàm tiện ích tính Checksum và truyền nhận ---

inline uint8_t calc_checksum(uint8_t type, uint8_t len, const uint8_t *data) {
    uint8_t cs = type ^ len;
    if (data && len > 0) {
        for (uint8_t i = 0; i < len; i++) {
            cs ^= data[i];
        }
    }
    return cs;
}

inline size_t send_frame(HardwareSerial &serial, uint8_t type, const uint8_t *data, uint8_t len) {
    if (len > MAX_PAYLOAD_LEN) return 0;

    uint8_t buf[MAX_PAYLOAD_LEN + 4];
    uint16_t idx = 0;

    buf[idx++] = FRAME_START_BYTE;
    buf[idx++] = type;
    buf[idx++] = len;

    if (len > 0 && data != nullptr) {
        memcpy(&buf[idx], data, len);
        idx += len;
    }

    buf[idx++] = calc_checksum(type, len, data);
    return serial.write(buf, idx);
}

template <typename T>
inline size_t send_msg(HardwareSerial &serial, MsgType type, const T &payload) {
    return send_frame(serial, static_cast<uint8_t>(type), reinterpret_cast<const uint8_t*>(&payload), sizeof(T));
}

inline size_t send_nack(HardwareSerial &serial, uint8_t bad_type, NackError err) {
    NackData nack = { static_cast<uint8_t>(err), bad_type };
    return send_msg(serial, MSG_NACK, nack);
}

// --- Máy trạng thái giải mã luồng byte ---
enum ParserState {
    STATE_WAIT_START = 0,
    STATE_WAIT_TYPE,
    STATE_WAIT_LEN,
    STATE_WAIT_DATA,
    STATE_WAIT_CHECKSUM
};

inline bool parse_byte(uint8_t byte_in, UartPacket &out_pkt) {
    static ParserState state = STATE_WAIT_START;
    static uint8_t rx_type = 0;
    static uint8_t rx_len = 0;
    static uint8_t rx_data[MAX_PAYLOAD_LEN];
    static uint8_t data_idx = 0;
    static uint32_t last_byte_time = 0;

    uint32_t now = millis();
    if (state != STATE_WAIT_START && (now - last_byte_time > FRAME_TIMEOUT_MS)) {
        state = STATE_WAIT_START;
    }
    last_byte_time = now;

    switch (state) {
        case STATE_WAIT_START:
            if (byte_in == FRAME_START_BYTE) {
                state = STATE_WAIT_TYPE;
            }
            break;

        case STATE_WAIT_TYPE:
            if (byte_in >= MSG_TELEMETRY && byte_in <= MSG_NACK) {
                rx_type = byte_in;
                state = STATE_WAIT_LEN;
            } else {
                state = STATE_WAIT_START;
            }
            break;

        case STATE_WAIT_LEN:
            if (byte_in <= MAX_PAYLOAD_LEN) {
                rx_len = byte_in;
                data_idx = 0;
                state = (rx_len == 0) ? STATE_WAIT_CHECKSUM : STATE_WAIT_DATA;
            } else {
                state = STATE_WAIT_START;
            }
            break;

        case STATE_WAIT_DATA:
            rx_data[data_idx++] = byte_in;
            if (data_idx >= rx_len) {
                state = STATE_WAIT_CHECKSUM;
            }
            break;

        case STATE_WAIT_CHECKSUM: {
            uint8_t expected_cs = calc_checksum(rx_type, rx_len, rx_data);
            state = STATE_WAIT_START;
            if (byte_in == expected_cs) {
                out_pkt.type = rx_type;
                out_pkt.len  = rx_len;
                if (rx_len > 0) {
                    memcpy(out_pkt.data, rx_data, rx_len);
                }
                return true;
            }
            break;
        }

        default:
            state = STATE_WAIT_START;
            break;
    }

    return false;
}

#endif // UART_PROTOCOL_H
