package com.guardian.dto;

import com.guardian.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class InviteUserRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    private Role role = Role.VIEWER;

    public InviteUserRequest() {}

    public InviteUserRequest(String email, Role role) {
        this.email = email;
        this.role = role != null ? role : Role.VIEWER;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
