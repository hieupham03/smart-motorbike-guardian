package com.guardian.service;

import com.guardian.dto.DeviceDto;
import com.guardian.entity.*;
import com.guardian.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.LoggerFactory;

@Service
public class RealtimeService {
    private final SimpMessagingTemplate socket;
    private final OwnershipRepository ownerships;
    private final UserRepository users;
    public record Event(String type, String deviceId, Object data, Instant sentAt) {}
    public RealtimeService(SimpMessagingTemplate socket, OwnershipRepository ownerships, UserRepository users) {
        this.socket = socket; this.ownerships = ownerships; this.users = users;
    }

    public void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { action.run(); }
            });
        } else action.run();
    }

    public void publish(Device device, String type, Object data) {
        DeviceDto snapshot = "DEVICE".equals(type) ? new DeviceDto(device) : null;
        if (snapshot != null) snapshot.setClaimToken(null);
        afterCommit(() -> {
            try {
                Map<String, Role> recipients = new LinkedHashMap<>();
                ownerships.findByDevice(device).forEach(o -> {
                    if ("ACTIVE".equals(o.getUser().getStatus())) recipients.put(o.getUser().getEmail(), o.getRole());
                });
                users.findAll().stream().filter(u -> u.getRole() == Role.ADMIN && "ACTIVE".equals(u.getStatus()))
                        .forEach(u -> recipients.put(u.getEmail(), Role.ADMIN));
                recipients.forEach((email, role) -> {
                    if (snapshot != null) snapshot.setCurrentUserRole(role);
                    socket.convertAndSendToUser(email, "/queue/events", new Event(type, device.getDeviceId(), snapshot != null ? snapshot : data, Instant.now()));
                });
            } catch (Exception e) {
                LoggerFactory.getLogger(RealtimeService.class).error("WebSocket delivery failed for device {}", device.getDeviceId(), e);
            }
        });
    }

    public void removeAccess(Device device, User user) {
        afterCommit(() -> socket.convertAndSendToUser(user.getEmail(), "/queue/events",
                new Event("ACCESS_REMOVED", device.getDeviceId(), Map.of("deviceId", device.getDeviceId()), Instant.now())));
    }
}
