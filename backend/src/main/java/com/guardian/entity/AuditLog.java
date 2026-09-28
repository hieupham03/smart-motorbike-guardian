package com.guardian.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user_ts", columnList = "user_id, ts"),
    @Index(name = "idx_audit_device_ts", columnList = "device_id, ts")
})
public class AuditLog {

    @Id
    @Column(name = "log_id", length = 36)
    private String logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Device device;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false, length = 50)
    private String result; // SUCCESS, FAILED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "source_ip", length = 64)
    private String sourceIp;

    @Column(nullable = false)
    private Long ts;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AuditLog() {}

    public AuditLog(String logId, User user, Device device, String action, String result, String details, String sourceIp) {
        this.logId = logId;
        this.user = user;
        this.device = device;
        this.action = action;
        this.result = result;
        this.details = details;
        this.sourceIp = sourceIp;
        this.ts = Instant.now().getEpochSecond();
        this.createdAt = Instant.now();
    }

    public String getLogId() { return logId; }
    public void setLogId(String logId) { this.logId = logId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }

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
