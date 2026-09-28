package com.guardian.dto;

import com.guardian.entity.Alert;
import com.guardian.entity.AlertSeverity;
import com.guardian.entity.AlertStatus;

import java.time.Instant;

public class AlertDto {
    private String alertId;
    private String deviceId;
    private String deviceName;
    private String reason;
    private AlertSeverity severity;
    private AlertStatus status;
    private String actionTaken;
    private String details;
    private String resolvedByEmail;
    private Instant createdAt;
    private Instant resolvedAt;

    public AlertDto() {}

    public AlertDto(Alert alert) {
        if (alert != null) {
            this.alertId = alert.getAlertId();
            if (alert.getDevice() != null) {
                this.deviceId = alert.getDevice().getDeviceId();
                this.deviceName = alert.getDevice().getName();
            }
            this.reason = alert.getReason();
            this.severity = alert.getSeverity();
            this.status = alert.getStatus();
            this.actionTaken = alert.getActionTaken();
            this.details = alert.getDetails();
            if (alert.getResolvedBy() != null) {
                this.resolvedByEmail = alert.getResolvedBy().getEmail();
            }
            this.createdAt = alert.getCreatedAt();
            this.resolvedAt = alert.getResolvedAt();
        }
    }

    public String getAlertId() { return alertId; }
    public void setAlertId(String alertId) { this.alertId = alertId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public AlertSeverity getSeverity() { return severity; }
    public void setSeverity(AlertSeverity severity) { this.severity = severity; }

    public AlertStatus getStatus() { return status; }
    public void setStatus(AlertStatus status) { this.status = status; }

    public String getActionTaken() { return actionTaken; }
    public void setActionTaken(String actionTaken) { this.actionTaken = actionTaken; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getResolvedByEmail() { return resolvedByEmail; }
    public void setResolvedByEmail(String resolvedByEmail) { this.resolvedByEmail = resolvedByEmail; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
