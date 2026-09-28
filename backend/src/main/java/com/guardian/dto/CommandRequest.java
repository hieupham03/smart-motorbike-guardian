package com.guardian.dto;

import com.guardian.entity.CommandType;
import jakarta.validation.constraints.NotNull;

public class CommandRequest {

    @NotNull(message = "Loại lệnh không được để trống")
    private CommandType type;

    private String payload;

    // Step-up confirmation password (Bắt buộc khi gửi lệnh LOCK_ENGINE nguy hiểm)
    private String confirmationPassword;

    public CommandRequest() {}

    public CommandRequest(CommandType type, String payload, String confirmationPassword) {
        this.type = type;
        this.payload = payload;
        this.confirmationPassword = confirmationPassword;
    }

    public CommandType getType() { return type; }
    public void setType(CommandType type) { this.type = type; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getConfirmationPassword() { return confirmationPassword; }
    public void setConfirmationPassword(String confirmationPassword) { this.confirmationPassword = confirmationPassword; }
}
