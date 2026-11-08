#include <cassert>
#include <cstdio>
#include <stdint.h>
#include "wheel_activity.h"

WheelActivityInput sample(uint32_t ms,uint32_t pulses,float speed=0,bool armed=false) {
    return {ms,42,pulses,ms,ms,speed,true,true,true,armed};
}
int main() {
    WheelActivityMonitor monitor;
    assert(monitor.update(sample(0,20))==0); // Existing pulses before first observation do not belong to this session.
    monitor.update(sample(500,21,3)); monitor.update(sample(1000,23,4));
    auto s=monitor.snapshot(1000);
    assert(s.pulses==3 && s.moving_ms==1000 && s.max_speed==4 && s.generation==1);
    auto invalid=sample(1500,999999,100); monitor.update(invalid);
    assert(!monitor.snapshot(1500).fresh && monitor.snapshot(1500).pulses==3);
    monitor.update(sample(1500,24,1));
    assert(monitor.resetSession(1500)); assert(monitor.snapshot(1500).pulses==0);
    monitor.update(sample(2000,25,1)); assert(monitor.snapshot(2000).pulses==1);
    auto reboot=sample(0,0); reboot.now=2500; reboot.source_boot=43;
    monitor.update(reboot); assert(monitor.snapshot(2500).generation==3 && monitor.snapshot(2500).pulses==0);

    WheelActivityMonitor guard;
    guard.update(sample(0,0));
    guard.update(sample(500,1,0,true)); // Arming baseline: ignore pre-arm pulses.
    assert(guard.update(sample(1000,2,0,true))==0);
    assert(guard.update(sample(1500,3,0,true))==0);
    assert(guard.update(sample(2000,4,0,true))==WHEEL_EVENT_GUARD);
    assert(guard.update(sample(2500,5,0,true))==0); // One alert per armed episode.
    guard.update(sample(3000,5)); guard.update(sample(3500,5,0,true));
    guard.update(sample(4000,6,0,true)); guard.update(sample(7500,7,0,true));
    assert(guard.update(sample(8000,8,0,true))==0); // An expired window cannot contribute old pulses.
    assert(guard.update(sample(8500,9,0,true))==0);
    assert(guard.update(sample(9000,10,0,true))==WHEEL_EVENT_GUARD);

    WheelActivityMonitor speed;
    speed.update(sample(0,0,3));
    for(uint32_t ms=500;ms<=1500;ms+=500) assert(speed.update(sample(ms,ms/500,3))==0);
    assert(speed.update(sample(2000,4,3))==WHEEL_EVENT_OVERSPEED);
    assert(speed.resetSession(2000)); // Resetting statistics must not spam a second warning.
    assert(speed.update(sample(2500,5,3))==0);
    speed.update(sample(3000,6,1.7f)); speed.update(sample(3500,7,3));
    assert(speed.snapshot(3500).overspeed); // Hysteresis band does not clear an episode.
    for(uint32_t ms=4000;ms<=6000;ms+=500) speed.update(sample(ms,ms/500,1));
    assert(!speed.snapshot(6000).overspeed);
    for(uint32_t ms=6500;ms<=8000;ms+=500) assert(speed.update(sample(ms,ms/500,3))==0);
    assert(speed.update(sample(8500,17,3))==WHEEL_EVENT_OVERSPEED);

    WheelActivityMonitor stale;
    stale.update(sample(0,0,3));
    auto repeated=sample(0,0,3); repeated.now=2500;
    assert(stale.update(repeated)==0); // Wall time alone cannot make an old speed sample overspeed.
    auto lost=sample(500,1,3); lost.counter_fresh=false;
    stale.update(lost); assert(!stale.resetSession(500));
    stale.update(sample(1000,2,3)); stale.update(sample(1500,3,3));
    auto badSpeed=sample(2000,4,100); badSpeed.speed_valid=false; stale.update(badSpeed);
    assert(stale.snapshot(2000).max_speed==3);
    stale.update(sample(2500,5,3)); stale.update(sample(3000,6,3)); stale.update(sample(3500,7,3));
    assert(stale.update(sample(4000,8,3))==0);
    assert(stale.update(sample(4500,9,3))==WHEEL_EVENT_OVERSPEED);

    WheelActivityMonitor gap;
    gap.update(sample(0,0,0,true));
    auto unavailable=sample(2000,0,0,true); unavailable.counter_fresh=false; gap.update(unavailable);
    assert(gap.update(sample(5000,10,0,true))==0); // Recovered accumulated counts are distance, not a current guard burst.
    assert(gap.snapshot(5000).pulses==10);
    gap.update(sample(5500,11,1,true));
    auto oldSpeed=sample(6000,12,100,true); oldSpeed.speed_ms=5000;
    gap.update(oldSpeed); assert(gap.snapshot(6000).max_speed==1);

    WheelActivityMonitor wrap;
    wrap.update(sample(UINT32_MAX-999,UINT32_MAX-1));
    wrap.update(sample(0,1));
    assert(wrap.snapshot(0).pulses==3 && wrap.snapshot(0).elapsed_ms==1000);
    WheelActivityMonitor configurable;
    assert(configurable.setSpeedLimit(5));
    assert(!configurable.setSpeedLimit(NAN) && !configurable.setSpeedLimit(0) && !configurable.setSpeedLimit(121));
    configurable.update(sample(0,0,3));
    for(uint32_t ms=500;ms<=2500;ms+=500) assert(configurable.update(sample(ms,ms/500,3))==0);
    auto before=configurable.snapshot(2500);
    assert(before.speed_limit==5 && before.pulses==5);
    assert(configurable.setSpeedLimit(2));
    for(uint32_t ms=3000;ms<5000;ms+=500) assert(configurable.update(sample(ms,ms/500,3))==0);
    assert(configurable.update(sample(5000,10,3))==WHEEL_EVENT_OVERSPEED);
    configurable.setSpeedLimit(5);
    assert(!configurable.snapshot(5000).overspeed && configurable.snapshot(5000).pulses==10);
    configurable.update(sample(5500,11,0,true));
    configurable.update(sample(6000,12,0,true));
    configurable.setSpeedLimit(6); // Editing overspeed settings cannot bypass the anti-theft burst.
    configurable.update(sample(6500,13,0,true));
    assert(configurable.update(sample(7000,14,0,true))==WHEEL_EVENT_GUARD);
    std::puts("PASS wheel activity: session/reset/reboot/wrap, Hall guard/window, configurable overspeed dwell/hysteresis/stale");
}
