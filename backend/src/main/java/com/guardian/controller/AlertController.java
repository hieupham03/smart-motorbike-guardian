package com.guardian.controller;

import com.guardian.dto.AlertDto;
import com.guardian.dto.ApiResponse;
import com.guardian.entity.AlertStatus;
import com.guardian.entity.User;
import com.guardian.service.AlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@Tag(name = "Alerts & Notifications", description = "Quản lý và xử lý các sự cố, cảnh báo bảo mật")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping
    @Operation(summary = "Xem danh sách cảnh báo (lọc theo thiết bị và trạng thái)")
    public ResponseEntity<ApiResponse<List<AlertDto>>> getAlerts(
            @RequestParam(value = "device_id", required = false) String deviceId,
            @RequestParam(value = "status", required = false) AlertStatus status,
            @AuthenticationPrincipal User currentUser) {
        List<AlertDto> alerts = alertService.getAlerts(deviceId, status, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(alerts));
    }

    @PostMapping("/{id}/acknowledge")
    @Operation(summary = "Xác nhận đã xem cảnh báo")
    public ResponseEntity<ApiResponse<AlertDto>> acknowledgeAlert(
            @PathVariable("id") String alertId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        String sourceIp = httpRequest.getRemoteAddr();
        AlertDto dto = alertService.acknowledgeAlert(alertId, currentUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Đã xác nhận cảnh báo", dto));
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Đánh dấu đã xử lý hoàn tất cảnh báo")
    public ResponseEntity<ApiResponse<AlertDto>> resolveAlert(
            @PathVariable("id") String alertId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        String sourceIp = httpRequest.getRemoteAddr();
        String actionTaken = (body != null && body.containsKey("actionTaken")) ? body.get("actionTaken") : "Đã xử lý an toàn";
        AlertDto dto = alertService.resolveAlert(alertId, actionTaken, currentUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Đã xử lý cảnh báo thành công", dto));
    }
}
