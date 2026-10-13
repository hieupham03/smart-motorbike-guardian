package com.guardian.dto;

import com.guardian.entity.Command;
import com.guardian.entity.CommandStatus;
import com.guardian.entity.CommandType;

import java.time.Instant;

public class CommandResponse {
    private String lateAckResult;
    private String lateAckReason;
    private java.time.Instant lateAckAt;
    private String cmdId;
    private String deviceId;
    private CommandType type;
    private CommandStatus status;
    private String payload;
    private String reasonIfFailed;
    private String issuedByEmail;
    private String issuedByName;
    private Instant issuedAt;
    private Instant ackAt;

    public CommandResponse() {}

    public CommandResponse(Command command) {
        if (command != null) {
            this.lateAckResult = command.getLateAckResult();
            this.lateAckReason = command.getLateAckReason();
            this.lateAckAt = command.getLateAckAt();
            this.cmdId = command.getCmdId();
            if (command.getDevice() != null) {
                this.deviceId = command.getDevice().getDeviceId();
            }
            if (command.getIssuedBy() != null) {
                this.issuedByEmail = command.getIssuedBy().getEmail();
                this.issuedByName = command.getIssuedBy().getFullName();
            }
            this.type = command.getType();
            this.status = command.getStatus();
            this.payload = command.getPayload();
            this.reasonIfFailed = command.getReasonIfFailed();
            this.issuedAt = command.getIssuedAt();
            this.ackAt = command.getAckAt();
        }
    }

    public String getCmdId() { return cmdId; }
    public void setCmdId(String cmdId) { this.cmdId = cmdId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public CommandType getType() { return type; }
    public void setType(CommandType type) { this.type = type; }

    public CommandStatus getStatus() { return status; }
    public void setStatus(CommandStatus status) { this.status = status; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getReasonIfFailed() { return reasonIfFailed; }
    public void setReasonIfFailed(String reasonIfFailed) { this.reasonIfFailed = reasonIfFailed; }

    public String getIssuedByEmail() { return issuedByEmail; }
    public void setIssuedByEmail(String issuedByEmail) { this.issuedByEmail = issuedByEmail; }

    public String getIssuedByName() { return issuedByName; }
    public void setIssuedByName(String issuedByName) { this.issuedByName = issuedByName; }

    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }

    public Instant getAckAt() { return ackAt; }
    public void setAckAt(Instant ackAt) { this.ackAt = ackAt; }
    public String getLateAckResult() { return lateAckResult; }
    public void setLateAckResult(String value) { this.lateAckResult = value; }
    public String getLateAckReason() { return lateAckReason; }
    public void setLateAckReason(String value) { this.lateAckReason = value; }
    public java.time.Instant getLateAckAt() { return lateAckAt; }
    public void setLateAckAt(java.time.Instant value) { this.lateAckAt = value; }
}
