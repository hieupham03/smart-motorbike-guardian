package com.guardian.dto;

import com.guardian.entity.Role;
import com.guardian.entity.User;

import java.time.Instant;

public class UserDto {
    private String userId;
    private String email;
    private String fullName;
    private Role role;
    private String status;
    private Instant createdAt;

    public UserDto() {}

    public UserDto(User user) {
        if (user != null) {
            this.userId = user.getUserId();
            this.email = user.getEmail();
            this.fullName = user.getFullName();
            this.role = user.getRole();
            this.status = user.getStatus();
            this.createdAt = user.getCreatedAt();
        }
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
