package com.guardian.controller;

import com.guardian.dto.*;
import com.guardian.entity.User;
import com.guardian.service.CommandService;
import com.guardian.service.DeviceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@Tag(name = "Device Management", description = "Quản lý vòng đời thiết bị, cấu hình và lệnh điều khiển")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private CommandService commandService;

    @GetMapping
    @Operation(summary = "Danh sách thiết bị người dùng có quyền truy cập (Owner hoặc Viewer)")
    public ResponseEntity<ApiResponse<List<DeviceDto>>> getDevices(@AuthenticationPrincipal User currentUser) {
        List<DeviceDto> devices = deviceService.getDevicesForUser(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(devices));
    }

    @PostMapping("/onboard")
    @Operation(summary = "Đăng ký/kích hoạt thiết bị mới bằng mã Claim Token (Quét QR)")
    public ResponseEntity<ApiResponse<DeviceDto>> onboardDevice(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody OnboardRequest request,
            HttpServletRequest httpRequest) {
        String sourceIp = httpRequest.getRemoteAddr();
        DeviceDto deviceDto = deviceService.onboardDevice(request, currentUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Kích hoạt thiết bị thành công", deviceDto));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết và trạng thái thiết bị")
    public ResponseEntity<ApiResponse<DeviceDto>> getDeviceDetail(
            @PathVariable("id") String deviceId,
            @AuthenticationPrincipal User currentUser) {
        DeviceDto deviceDto = deviceService.getDeviceDetail(deviceId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(deviceDto));
    }

    @PatchMapping("/{id}/config")
    @Operation(summary = "Cập nhật cấu hình ngưỡng cảnh báo thiết bị")
    public ResponseEntity<ApiResponse<DeviceDto>> updateConfig(
            @PathVariable("id") String deviceId,
            @RequestBody DeviceConfigRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        String sourceIp = httpRequest.getRemoteAddr();
        DeviceDto deviceDto = deviceService.updateConfig(deviceId, request, currentUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật cấu hình thành công", deviceDto));
    }

    @PostMapping("/{id}/command")
    @Operation(summary = "Gửi lệnh điều khiển xuống thiết bị (Arm, Disarm, Lock Engine...)")
    public ResponseEntity<ApiResponse<CommandResponse>> sendCommand(
            @PathVariable("id") String deviceId,
            @Valid @RequestBody CommandRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        String sourceIp = httpRequest.getRemoteAddr();
        CommandResponse response = commandService.sendCommand(deviceId, request, currentUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Lệnh đã được gửi thành công", response));
    }

    @GetMapping("/{id}/commands")
    @Operation(summary = "Xem lịch sử lệnh điều khiển của thiết bị")
    public ResponseEntity<ApiResponse<List<CommandResponse>>> getDeviceCommands(
            @PathVariable("id") String deviceId,
            @AuthenticationPrincipal User currentUser) {
        List<CommandResponse> commands = commandService.getCommandsForDevice(deviceId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(commands));
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "Thu hồi quyền kết nối của thiết bị")
    public ResponseEntity<ApiResponse<DeviceDto>> revokeDevice(
            @PathVariable("id") String deviceId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        String sourceIp = httpRequest.getRemoteAddr();
        DeviceDto deviceDto = deviceService.revokeDevice(deviceId, currentUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Đã thu hồi quyền kết nối của thiết bị", deviceDto));
    }

    @PostMapping("/{id}/decommission")
    @Operation(summary = "Ngừng sử dụng thiết bị vĩnh viễn")
    public ResponseEntity<ApiResponse<DeviceDto>> decommissionDevice(
            @PathVariable("id") String deviceId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        String sourceIp = httpRequest.getRemoteAddr();
        DeviceDto deviceDto = deviceService.decommissionDevice(deviceId, currentUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Đã ngừng sử dụng thiết bị vĩnh viễn", deviceDto));
    }

    @GetMapping("/{id}/users")
    @Operation(summary = "Xem danh sách người dùng được uỷ quyền xem xe")
    public ResponseEntity<ApiResponse<List<UserDto>>> getDeviceUsers(
            @PathVariable("id") String deviceId,
            @AuthenticationPrincipal User currentUser) {
        List<UserDto> users = deviceService.getDeviceUsers(deviceId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping("/{id}/users")
    @Operation(summary = "Mời người dùng khác (gán vai trò Viewer) truy cập thiết bị")
    public ResponseEntity<ApiResponse<String>> inviteUser(
            @PathVariable("id") String deviceId,
            @Valid @RequestBody InviteUserRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        String sourceIp = httpRequest.getRemoteAddr();
        deviceService.inviteViewer(deviceId, request, currentUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Đã cấp quyền truy cập cho người dùng", null));
    }

    @DeleteMapping("/{id}/users/{userId}")
    @Operation(summary = "Gỡ quyền truy cập của một người dùng khỏi thiết bị")
    public ResponseEntity<ApiResponse<String>> removeUser(
            @PathVariable("id") String deviceId,
            @PathVariable("userId") String targetUserId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        String sourceIp = httpRequest.getRemoteAddr();
        deviceService.removeUserFromDevice(deviceId, targetUserId, currentUser, sourceIp);
        return ResponseEntity.ok(ApiResponse.ok("Đã xoá quyền truy cập của người dùng", null));
    }
}
