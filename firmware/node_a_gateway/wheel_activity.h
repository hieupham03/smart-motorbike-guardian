#pragma once
#include <stdint.h>
#include <math.h>
#include "guardian_config.h"

// Pure logic shared by the gateway and host tests. No GPIO, MQTT or RTOS ownership.
struct WheelActivityInput {
    uint32_t now, source_boot, pulse_count, counter_ms, speed_ms;
    float speed;
    bool counter_fresh, telemetry_fresh, speed_valid, armed;
};
struct WheelSessionSnapshot {
    uint32_t generation, source_boot, elapsed_ms;
    uint64_t pulses, moving_ms;
    float max_speed;
    bool available, fresh, overspeed;
    float speed_limit;
};
enum WheelActivityEvent : uint8_t { WHEEL_EVENT_NONE=0, WHEEL_EVENT_GUARD=1, WHEEL_EVENT_OVERSPEED=2 };

class WheelActivityMonitor {
public:
    static bool validSpeedLimit(float value) {
        return isfinite(value) && value>=1.0f && value<=120.0f;
    }
    bool setSpeedLimit(float value) {
        if(!validSpeedLimit(value)) return false;
        if(value!=speedLimit_) {
            speedLimit_=value;
            // A new threshold starts a new dwell period, without touching theft protection/session totals.
            highTracking_=lowTracking_=overspeed_=false;
        }
        return true;
    }
    uint8_t update(const WheelActivityInput &in) {
        uint8_t events=0;
        bool enteredArmed=in.armed && !armed_;
        if(in.armed!=armed_) { guardWindow_=false; guardCount_=0; guardSent_=false; }
        armed_=in.armed;
        fresh_=in.counter_fresh && in.telemetry_fresh;
        if(!fresh_) { highTracking_=lowTracking_=false; guardWindow_=false; guardCount_=0; return events; }
        if(!haveCounter_ || in.source_boot!=sourceBoot_) {
            haveCounter_=true; sourceBoot_=in.source_boot;
            lastCount_=in.pulse_count; lastCounterMs_=in.counter_ms;
            haveSpeed_=false; highTracking_=lowTracking_=overspeed_=false;
            guardWindow_=false; guardCount_=0; guardSent_=false;
            resetSession(in.now);
        } else if(in.counter_ms!=lastCounterMs_) {
            uint32_t elapsed=in.counter_ms-lastCounterMs_, delta=in.pulse_count-lastCount_;
            // ISR accepts at most one pulse per 10 ms. Reject old/corrupt counter snapshots.
            if(elapsed>=0x80000000UL || delta>elapsed/10+2) {
                fresh_=false; highTracking_=lowTracking_=false; return events;
            }
            pulses_+=delta;
            if(delta && elapsed<=SENSOR_STALE_MS) movingMs_+=elapsed;
            lastCount_=in.pulse_count; lastCounterMs_=in.counter_ms;
            if(elapsed>WHEEL_GUARD_WINDOW_MS) { guardWindow_=false; guardCount_=0; }
            if(in.armed && !enteredArmed && delta && !guardSent_ && elapsed<=WHEEL_GUARD_WINDOW_MS) {
                if(!guardWindow_ || uint32_t(in.counter_ms-guardStart_)>WHEEL_GUARD_WINDOW_MS) {
                    guardWindow_=true; guardStart_=in.counter_ms; guardCount_=0;
                }
                guardCount_+=delta;
                if(guardCount_>=WHEEL_GUARD_MIN_PULSES) { guardSent_=true; events|=WHEEL_EVENT_GUARD; }
            }
        } else if(in.pulse_count!=lastCount_) {
            fresh_=false; highTracking_=lowTracking_=false; return events;
        }
        bool valid=in.speed_valid && isfinite(in.speed) && in.speed>=0 && in.speed<=120;
        // Counter and speed use the same Node B clock; they must belong to the same period.
        uint32_t separation=in.speed_ms-in.counter_ms;
        if(separation>SENSOR_STALE_MS && uint32_t(in.counter_ms-in.speed_ms)>SENSOR_STALE_MS) valid=false;
        if(!valid) { highTracking_=lowTracking_=false; return events; }
        if(haveSpeed_ && in.speed_ms==lastSpeedMs_) return events; // A repeated sample cannot satisfy dwell.
        if(haveSpeed_) {
            uint32_t elapsed=in.speed_ms-lastSpeedMs_;
            if(elapsed>=0x80000000UL) { fresh_=false; highTracking_=lowTracking_=false; return events; }
            if(elapsed>SENSOR_STALE_MS) highTracking_=lowTracking_=false;
        }
        if(in.speed>maxSpeed_) maxSpeed_=in.speed;
        haveSpeed_=true; lastSpeedMs_=in.speed_ms;
        if(in.speed>speedLimit_) {
            lowTracking_=false;
            if(!overspeed_) {
                if(!highTracking_) { highTracking_=true; highStart_=in.speed_ms; }
                if(uint32_t(in.speed_ms-highStart_)>=OVERSPEED_HOLD_MS) {
                    overspeed_=true; highTracking_=false; events|=WHEEL_EVENT_OVERSPEED;
                }
            }
        } else {
            highTracking_=false;
            if(overspeed_ && in.speed<=speedLimit_-OVERSPEED_HYSTERESIS_KMH) {
                if(!lowTracking_) { lowTracking_=true; lowStart_=in.speed_ms; }
                if(uint32_t(in.speed_ms-lowStart_)>=OVERSPEED_CLEAR_MS) { overspeed_=false; lowTracking_=false; }
            } else lowTracking_=false;
        }
        return events;
    }
    bool resetSession(uint32_t now) {
        if(!haveCounter_ || !fresh_) return false;
        ++generation_; startMs_=now; pulses_=movingMs_=0; maxSpeed_=0;
        return true; // Deliberately does not reset guard/overspeed detection.
    }
    WheelSessionSnapshot snapshot(uint32_t now) const {
        return {generation_,sourceBoot_,uint32_t(now-startMs_),pulses_,movingMs_,maxSpeed_,haveCounter_,fresh_,overspeed_,speedLimit_};
    }
private:
    uint32_t sourceBoot_=0,lastCount_=0,lastCounterMs_=0,lastSpeedMs_=0,generation_=0,startMs_=0;
    uint32_t guardStart_=0,guardCount_=0,highStart_=0,lowStart_=0;
    uint64_t pulses_=0,movingMs_=0;
    float maxSpeed_=0;
    float speedLimit_=OVERSPEED_LIMIT_KMH;
    bool haveCounter_=false,haveSpeed_=false,fresh_=false,armed_=false;
    bool guardWindow_=false,guardSent_=false,highTracking_=false,lowTracking_=false,overspeed_=false;
};
