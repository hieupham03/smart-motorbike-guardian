package com.guardian.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "commands")
public class Command {

    @Id
    @Column(name = "cmd_id", length = 36)
    private String cmdId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "issued_by", nullable = false)
    private User issuedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CommandType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CommandStatus status = CommandStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "reason_if_failed", length = 255)
    private String reasonIfFailed;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant issuedAt = Instant.now();

    @Column(name = "ack_at")
    private Instant ackAt;

    public Command() {}

    public Command(String cmdId, Device device, User issuedBy, CommandType type, String payload) {
        this.cmdId = cmdId;
        this.device = device;
        this.issuedBy = issuedBy;
        this.type = type;
        this.payload = payload;
        this.status = CommandStatus.PENDING;
        this.issuedAt = Instant.now();
    }

    public String getCmdId() { return cmdId; }
    public void setCmdId(String cmdId) { this.cmdId = cmdId; }

    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }

    public User getIssuedBy() { return issuedBy; }
    public void setIssuedBy(User issuedBy) { this.issuedBy = issuedBy; }

    public CommandType getType() { return type; }
    public void setType(CommandType type) { this.type = type; }

    public CommandStatus getStatus() { return status; }
    public void setStatus(CommandStatus status) { this.status = status; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getReasonIfFailed() { return reasonIfFailed; }
    public void setReasonIfFailed(String reasonIfFailed) { this.reasonIfFailed = reasonIfFailed; }

    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }

    public Instant getAckAt() { return ackAt; }
    public void setAckAt(Instant ackAt) { this.ackAt = ackAt; }
}
