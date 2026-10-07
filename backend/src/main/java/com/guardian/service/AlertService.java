package com.guardian.service;

import com.guardian.dto.AlertDto;
import com.guardian.dto.DeviceDto;
import com.guardian.entity.*;
import com.guardian.exception.ForbiddenException;
import com.guardian.exception.ResourceNotFoundException;
import com.guardian.repository.AlertRepository;
import com.guardian.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public AlertDto processAlert(String deviceId, AlertDto dto) {
        Device device = deviceRepository.findById(deviceId)
                .orElseGet(() -> deviceRepository.findByDeviceUuid(deviceId).orElse(null));
        if (device == null) return null;

        String alertId = dto.getAlertId() != null ? dto.getAlertId() : "alt-" + UUID.randomUUID().toString().substring(0, 8);

        // Check duplicate alertId
        if (alertRepository.existsById(alertId)) {
            return null; // Ignore duplicate alert according to specs
        }

        AlertSeverity severity = dto.getSeverity() != null ? dto.getSeverity() : AlertSeverity.MEDIUM;
        String reason = dto.getReason() != null ? dto.getReason() : "UNSPECIFIED_ANOMALY";
        String actionTaken = dto.getActionTaken() != null ? dto.getActionTaken() : "LOGGED";

        Alert alert = new Alert(alertId, device, reason, severity, actionTaken, dto.getDetails());
        alertRepository.save(alert);

        AlertDto resultDto = new AlertDto(alert);

        // Push real-time alert via WebSocket
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/devices/" + deviceId + "/alerts", resultDto);
                messagingTemplate.convertAndSend("/topic/alerts", resultDto);
            } catch (Exception ignored) {}
        }

        return resultDto;
    }

    @Transactional(readOnly = true)
    public List<AlertDto> getAlerts(String deviceId, AlertStatus status, User user) {
        if (deviceId != null && !deviceId.isBlank()) {
            Device device = deviceService.getDeviceEntityChecked(deviceId, user, false);
            if (status != null) {
                return alertRepository.findByDeviceAndStatusOrderByCreatedAtDesc(device, status).stream()
                        .map(AlertDto::new)
                        .collect(Collectors.toList());
            } else {
                return alertRepository.findByDeviceOrderByCreatedAtDesc(device).stream()
                        .map(AlertDto::new)
                        .collect(Collectors.toList());
            }
        }

        if (user.getRole() == Role.ADMIN) {
            if (status != null) {
                return alertRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                        .map(AlertDto::new)
                        .collect(Collectors.toList());
            } else {
                return alertRepository.findByOrderByCreatedAtDesc().stream()
                        .map(AlertDto::new)
                        .collect(Collectors.toList());
            }
        }

        // For regular user, collect alerts from their owned/accessible devices
        List<DeviceDto> userDevices = deviceService.getDevicesForUser(user);
        List<String> deviceIds = userDevices.stream().map(DeviceDto::getDeviceId).collect(Collectors.toList());

        return alertRepository.findByOrderByCreatedAtDesc().stream()
                .filter(a -> a.getDevice() != null && deviceIds.contains(a.getDevice().getDeviceId()))
                .filter(a -> status == null || a.getStatus() == status)
                .map(AlertDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlertDto acknowledgeAlert(String alertId, User user, String sourceIp) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cảnh báo với ID: " + alertId));

        deviceService.getDeviceEntityChecked(alert.getDevice().getDeviceId(), user, false);

        if (alert.getStatus() == AlertStatus.OPEN) {
            alert.setStatus(AlertStatus.ACKNOWLEDGED);
            alertRepository.save(alert);

            auditLogService.log(user, alert.getDevice(), "ALERT_ACKNOWLEDGED", "SUCCESS",
                    "Xác nhận đã đọc cảnh báo " + alert.getReason() + " (" + alert.getAlertId() + ")", sourceIp);
        }

        return new AlertDto(alert);
    }

    @Transactional
    public AlertDto resolveAlert(String alertId, String actionTaken, User user, String sourceIp) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cảnh báo với ID: " + alertId));

        deviceService.getDeviceEntityChecked(alert.getDevice().getDeviceId(), user, true); // Only Owner/Admin can resolve

        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedBy(user);
        alert.setResolvedAt(Instant.now());
        if (actionTaken != null && !actionTaken.isBlank()) {
            alert.setActionTaken(actionTaken);
        }
        alertRepository.save(alert);

        auditLogService.log(user, alert.getDevice(), "ALERT_RESOLVED", "SUCCESS",
                "Đánh dấu đã xử lý cảnh báo " + alert.getReason() + " (" + alert.getAlertId() + ")", sourceIp);

        return new AlertDto(alert);
    }
}
