package com.guardian.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.guardian.dto.WheelSessionDto;
import com.guardian.entity.*;
import com.guardian.repository.DeviceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WheelSessionService {
    private final DeviceRepository devices;
    private final DeviceService access;
    private final RealtimeService realtime;
    private final ConcurrentHashMap<String, WheelSessionDto> latest = new ConcurrentHashMap<>();
    public WheelSessionService(DeviceRepository devices, DeviceService access, RealtimeService realtime) {
        this.devices=devices; this.access=access; this.realtime=realtime;
    }

    // No database writes/migration: the user explicitly chose RAM sessions.
    public synchronized WheelSessionDto accept(String uuid, JsonNode node) {
        Device device=devices.findByDeviceUuid(uuid).orElseGet(() -> devices.findById(uuid).orElse(null));
        if(device==null || !"HARDWARE".equals(device.getDataSource()) ||
                device.getLifecycleState()==LifecycleState.FAULT || device.getLifecycleState()==LifecycleState.DECOMMISSIONED ||
                !"HARDWARE".equals(node.path("data_source").asText())) return null;
        String id=node.path("session_id").asText();
        if(!id.matches("[0-9a-f]{8}-[0-9]{1,10}")) return null;
        String[] integers={"sequence","source_boot_id","pulse_count","moving_ms","elapsed_ms","pulses_per_rev"};
        for(String key:integers) if(!node.path(key).isIntegralNumber() || !node.path(key).canConvertToLong() || node.path(key).asLong()<0) return null;
        String[] numbers={"revolutions","distance_m","max_speed_kmh","speed_limit_kmh","circumference_m"};
        for(String key:numbers) if(!node.path(key).isNumber() || !Double.isFinite(node.path(key).asDouble()) || node.path(key).asDouble()<0) return null;
        if(!node.path("fresh").isBoolean() || !node.path("overspeed_active").isBoolean()) return null;
        long seq=node.path("sequence").asLong(), boot=node.path("source_boot_id").asLong(), pulses=node.path("pulse_count").asLong();
        long moving=node.path("moving_ms").asLong(), elapsed=node.path("elapsed_ms").asLong(), perRev=node.path("pulses_per_rev").asLong();
        double circumference=node.path("circumference_m").asDouble(), revolutions=node.path("revolutions").asDouble(), distance=node.path("distance_m").asDouble();
        double max=node.path("max_speed_kmh").asDouble(), limit=node.path("speed_limit_kmh").asDouble();
        if(seq>0xffffffffL || boot>0xffffffffL || pulses>9_007_199_254_740_991L || elapsed>0xffffffffL || moving>elapsed+1500 ||
                perRev<1 || perRev>100 || circumference<=0 || circumference>10 || max>120 || limit<=0 || limit>120) return null;
        if(Math.abs(revolutions-(double)pulses/perRev)>Math.max(0.01,revolutions*0.00001) ||
                Math.abs(distance-(double)pulses*circumference/perRev)>Math.max(0.01,distance*0.00001)) return null;
        WheelSessionDto old=latest.get(device.getDeviceId());
        if(old!=null && old.sessionId().substring(0,8).equals(id.substring(0,8))) {
            long delta=(seq-old.sequence())&0xffffffffL;
            if(delta==0 || delta>=0x80000000L) return null;
            if(old.sessionId().equals(id) && (pulses<old.pulseCount() || distance+0.01<old.distanceM())) return null;
        }
        WheelSessionDto dto=new WheelSessionDto(device.getDeviceId(),id,seq,boot,pulses,revolutions,distance,max,
                Math.min(moving,elapsed),elapsed,node.path("fresh").asBoolean(),node.path("overspeed_active").asBoolean(),limit,circumference,perRev,Instant.now(),
                node.path("speed_limit_configurable").isBoolean() && node.path("speed_limit_configurable").asBoolean());
        latest.put(device.getDeviceId(),dto);
        realtime.publish(device,"WHEEL_SESSION",dto);
        return dto;
    }

    @Transactional(readOnly=true)
    public WheelSessionDto get(String id, User user) {
        Device device=access.getDeviceEntityChecked(id,user,false);
        WheelSessionDto dto=latest.get(device.getDeviceId());
        if(dto==null || !"HARDWARE".equals(device.getDataSource())) return null;
        boolean fresh=dto.fresh() && dto.receivedAt().isAfter(Instant.now().minusSeconds(5)) &&
                device.getLifecycleState()==LifecycleState.ACTIVE && Boolean.TRUE.equals(device.getSensorConnected());
        return dto.withFresh(fresh);
    }
}
