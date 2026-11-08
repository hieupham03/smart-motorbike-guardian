#pragma once
// ESP32-S3 N16R8: verify GPIO6/7 exist on your board headers.
constexpr int GPS_RX_PIN=6, GPS_TX_PIN=7; // GPS TX -> GPIO6; GPS RX initially disconnected
constexpr uint32_t GPS_BAUD=9600, GPS_STALE_MS=5000;
constexpr uint32_t SENSOR_STALE_MS=1500, WHEEL_STOP_MS=4000;
constexpr float WHEEL_CIRCUMFERENCE_M=0.20420352f; // pi * 0.065 m; wheel diameter 6.5 cm
constexpr uint32_t WHEEL_PULSES_PER_REV=1;
constexpr uint32_t WHEEL_GUARD_MIN_PULSES=3, WHEEL_GUARD_WINDOW_MS=3000;
constexpr float OVERSPEED_LIMIT_KMH=2.0f, OVERSPEED_HYSTERESIS_KMH=0.5f;
constexpr uint32_t OVERSPEED_HOLD_MS=2000, OVERSPEED_CLEAR_MS=2000;
constexpr bool RELAY_ACTIVE_LOW=false; // Module Relay thực tế kích mức CAO (Active-HIGH)
constexpr bool RELAY_POWER_ON_AT_BOOT=true; // Bật nguồn motor ngay khi khởi động
