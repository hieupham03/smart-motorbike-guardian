#pragma once
// ESP32-S3 N16R8: verify GPIO6/7 exist on your board headers.
constexpr int GPS_RX_PIN=6, GPS_TX_PIN=7; // GPS TX -> GPIO6; GPS RX initially disconnected
constexpr uint32_t GPS_BAUD=9600, GPS_STALE_MS=5000;
constexpr uint32_t SENSOR_STALE_MS=1500, WHEEL_STOP_MS=4000;
constexpr float WHEEL_CIRCUMFERENCE_M=0.5f; // Measure YOUR wheel
constexpr uint32_t WHEEL_PULSES_PER_REV=1;
constexpr bool RELAY_ACTIVE_LOW=true; // Select LOW trigger jumper, COM-NO load
constexpr bool RELAY_POWER_ON_AT_BOOT=false; // Motor off until ARM/DISARM/UNLOCK
