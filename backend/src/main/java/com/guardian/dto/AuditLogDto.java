package com.guardian.dto;

import com.guardian.entity.AuditLog;

import java.time.Instant;

public class AuditLogDto {
    private String logId;
    private String userEmail;
    private String userName;
    private String deviceId;
    private String deviceName;
    private String action;
    private String result;
    private String details;
    private String sourceIp;
    private Long ts;
    private Instant createdAt;

    public AuditLogDto() {}

    public AuditLogDto(AuditLog log) {
        if (log != null) {
            this.logId = log.getLogId();
            if (log.getUser() != null) {
                this.userEmail = log.getUser().getEmail();
                this.userName = log.getUser().getFullName();
            }
            if (log.getDevice() != null) {
                this.deviceId = log.getDevice().getDeviceId();
                this.deviceName = log.getDevice().getName();
            }
            this.action = log.getAction();
            this.result = log.getResult();
            this.details = log.getDetails();
            this.sourceIp = log.getSourceIp();
            this.ts = log.getTs();
            this.createdAt = log.getCreatedAt();
        }
    }

    public String getLogId() { return logId; }
    public void setLogId(String logId) { this.logId = logId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getSourceIp() { return sourceIp; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }

    public Long getTs() { return ts; }
    public void setTs(Long ts) { this.ts = ts; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
