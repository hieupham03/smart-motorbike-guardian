#include <cassert>
#include <cmath>
#include <cstdio>
#include "wheel_speed.h"

int main() {
    // Do not turn the elapsed time after the first pulse into a fake 62 km/h.
    auto first = estimate_wheel_speed(0, 29000, 29);
    assert(!first.valid && first.kmh == 0);
    auto stopped = estimate_wheel_speed(0, 0, WHEEL_STOP_MS);
    assert(stopped.valid && stopped.kmh == 0);
    auto moving = estimate_wheel_speed(200000, 20000, 20);
    float expected = WHEEL_CIRCUMFERENCE_M * 3600000.0f / (WHEEL_PULSES_PER_REV * 200000);
    assert(moving.valid && std::fabs(moving.kmh - expected) < 0.001f);
    assert(estimate_wheel_speed(0, 20000, 20).valid == false); // Re-primed after a stop.
    assert(estimate_wheel_speed(200000, 400000, 400).kmh < moving.kmh);
    assert(estimate_wheel_speed(200000, 4000000, WHEEL_STOP_MS).kmh == 0);
    assert(sensor_sample_fresh(2500, 1000));
    assert(!sensor_sample_fresh(2501, 1000));
    assert(sensor_sample_fresh(100, UINT32_MAX - 50)); // millis wrap.
    assert(wheel_period_after_pulse(false, 100, 100000) == 0);
    assert(wheel_period_after_pulse(true, 200, 200000) == 200000);
    assert(wheel_period_after_pulse(true, 5000000, 15000) == 0); // Long stop across micros wrap.
    std::puts("PASS wheel speed: first/second pulse, stop/resume, decay, sample freshness and wrap");
}
