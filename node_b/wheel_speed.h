#pragma once
#include <stdint.h>
#include "guardian_config.h"

struct WheelSpeedEstimate { float kmh; bool valid; };

// Use millis idle to re-prime even when the microsecond clock wraps during a stop.
constexpr uint32_t wheel_period_after_pulse(bool previous, uint32_t elapsedMs, uint32_t elapsedUs) {
    return previous && elapsedMs < WHEEL_STOP_MS ? elapsedUs : 0;
}

// A single pulse means motion, but cannot establish a rotation period.
inline WheelSpeedEstimate estimate_wheel_speed(uint32_t periodUs, uint32_t elapsedUs, uint32_t idleMs) {
    if (idleMs >= WHEEL_STOP_MS) return {0.0f, true};
    if (!periodUs) return {0.0f, false};
    uint32_t effective = periodUs > elapsedUs ? periodUs : elapsedUs;
    if (effective < 10000) effective = 10000;
    float kmh = WHEEL_CIRCUMFERENCE_M * 3600000.0f / (WHEEL_PULSES_PER_REV * effective);
    return {kmh <= 120.0f ? kmh : 0.0f, kmh <= 120.0f};
}

inline bool sensor_sample_fresh(uint32_t now, uint32_t sampledAt) {
    return uint32_t(now - sampledAt) <= SENSOR_STALE_MS;
}
