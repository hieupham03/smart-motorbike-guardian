package com.guardian.service;

import com.guardian.entity.*;
import com.guardian.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
public class DevicePresenceService {
    private final DeviceRepository devices;
    private final RealtimeService realtime;
    private final PushNotificationService push;
    @Value("${app.realtime.offline-timeout-seconds:45}") private long timeout;
    public DevicePresenceService(DeviceRepository devices, RealtimeService realtime, PushNotificationService push) { this.devices = devices; this.realtime = realtime; this.push = push; }
    @Transactional public void status(String id, boolean online, String firmware) {
        var device = devices.findLockedByUuid(id).orElseGet(() -> devices.findLockedById(id).orElse(null));
        if (device == null || !"HARDWARE".equals(device.getDataSource()) || device.getLifecycleState() == LifecycleState.FAULT || device.getLifecycleState() == LifecycleState.DECOMMISSIONED) return;
        boolean becameOffline = !online && device.getLifecycleState() != LifecycleState.OFFLINE;
        device.setLifecycleState(online ? LifecycleState.ACTIVE : LifecycleState.OFFLINE);
        if (online) device.setLastSeenAt(Instant.now()); else invalidate(device);
        if (firmware != null) device.setFirmwareVersion(firmware);
        devices.save(device); realtime.publish(device, "DEVICE", null); if (becameOffline) notifyOffline(device);
    }
    private void invalidate(Device device) {
        device.setSensorConnected(false); device.setSpeedValid(false); device.setImuValid(false); device.setGpsValid(false); device.setLastSpeedKmh(null);
    }
    @Scheduled(fixedDelay = 1000)
    @Transactional public void expire() {
        Instant now = Instant.now();
        // Query IDs, then reload under a lock so a new telemetry sample cannot be overwritten by expiry.
        var candidates = devices.findActiveIds();
        for (String id : candidates) {
            var device = devices.findLockedById(id).orElse(null);
            if (device == null || device.getLifecycleState() != LifecycleState.ACTIVE) continue;
            boolean changed = false;
            if (device.getLastSeenAt() == null || device.getLastSeenAt().isBefore(now.minusSeconds(timeout))) {
                device.setLifecycleState(LifecycleState.OFFLINE); invalidate(device); changed = true;
            } else if (device.getLastTelemetryAt() == null || device.getLastTelemetryAt().isBefore(now.minusSeconds(5))) {
                if (Boolean.TRUE.equals(device.getSensorConnected()) || Boolean.TRUE.equals(device.getGpsValid())) { invalidate(device); changed = true; }
            }
            if (Boolean.TRUE.equals(device.getGpsValid()) && device.getLastTelemetryAt() != null && device.getGpsAgeMs() != null
                    && java.time.Duration.between(device.getLastTelemetryAt(), now).toMillis() + device.getGpsAgeMs() > 5000) {
                device.setGpsValid(false); changed = true;
            }
            if (changed) { devices.save(device); realtime.publish(device, "DEVICE", null); if (device.getLifecycleState() == LifecycleState.OFFLINE) notifyOffline(device); }
        }
    }
    private void notifyOffline(Device device) {
        String occurrence = device.getLastSeenAt() == null ? "never" : String.valueOf(device.getLastSeenAt().toEpochMilli());
        realtime.afterCommit(() -> push.notifyDevice(device, "offline:" + device.getDeviceId() + ":" + occurrence,
                "Thiết bị mất kết nối", device.getName() + " đang ngoại tuyến",
                java.util.Map.of("type", "DEVICE_OFFLINE", "deviceId", device.getDeviceId())));
    }
}
