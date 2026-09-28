package com.guardian.controller;

import com.guardian.dto.ApiResponse;
import com.guardian.dto.AuditLogDto;
import com.guardian.dto.DeviceDto;
import com.guardian.dto.UserDto;
import com.guardian.entity.User;
import com.guardian.service.AuditLogService;
import com.guardian.service.DeviceService;
import com.guardian.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Portal", description = "Quản trị hệ thống, toàn bộ người dùng, thiết bị và Nhật ký kiểm toán (Audit Logs)")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping("/users")
    @Operation(summary = "Xem toàn bộ danh sách tài khoản người dùng trong hệ thống")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Khoá hoặc mở khoá tài khoản người dùng")
    public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
            @PathVariable("id") String userId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User adminUser,
            HttpServletRequest httpRequest) {
        String status = body.getOrDefault("status", "ACTIVE");
        String sourceIp = httpRequest.getRemoteAddr();
        UserDto userDto = userService.updateUserStatus(userId, status, adminUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái người dùng thành công", userDto));
    }

    @GetMapping("/devices")
    @Operation(summary = "Xem toàn bộ danh sách thiết bị trong hệ thống")
    public ResponseEntity<ApiResponse<List<DeviceDto>>> getAllDevices() {
        List<DeviceDto> devices = deviceService.getAllDevicesAdmin();
        return ResponseEntity.ok(ApiResponse.ok(devices));
    }

    @GetMapping("/audit-log")
    @Operation(summary = "Tra cứu nhật ký kiểm toán hệ thống (Audit Trail)")
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getAuditLogs() {
        List<AuditLogDto> logs = auditLogService.getAllLogs();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
