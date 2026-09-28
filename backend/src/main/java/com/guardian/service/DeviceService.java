package com.guardian.service;

import com.guardian.dto.*;
import com.guardian.entity.*;
import com.guardian.exception.BadRequestException;
import com.guardian.exception.ForbiddenException;
import com.guardian.exception.ResourceNotFoundException;
import com.guardian.repository.DeviceRepository;
import com.guardian.repository.OwnershipRepository;
import com.guardian.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private OwnershipRepository ownershipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<DeviceDto> getDevicesForUser(User user) {
        if (user.getRole() == Role.ADMIN) {
            return deviceRepository.findAll().stream()
                    .map(d -> new DeviceDto(d, Role.ADMIN))
                    .collect(Collectors.toList());
        }

        List<Ownership> ownerships = ownershipRepository.findByUser(user);
        return ownerships.stream()
                .map(o -> new DeviceDto(o.getDevice(), o.getRole()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DeviceDto getDeviceDetail(String deviceId, User user) {
        Device device = getDeviceEntityChecked(deviceId, user, false);
        Role userRole = getUserRoleForDevice(user, device);
        return new DeviceDto(device, userRole);
    }

    @Transactional(readOnly = true)
    public Device getDeviceEntityChecked(String deviceId, User user, boolean requireOwner) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị với ID: " + deviceId));

        if (user.getRole() == Role.ADMIN) {
            return device;
        }

        Ownership ownership = ownershipRepository.findByUserAndDevice(user, device)
                .orElseThrow(() -> new ForbiddenException("Bạn không có quyền truy cập thiết bị này"));

        if (requireOwner && ownership.getRole() != Role.OWNER) {
            throw new ForbiddenException("Chỉ chủ xe (Owner) mới có quyền thực hiện thao tác này");
        }

        return device;
    }

    public Role getUserRoleForDevice(User user, Device device) {
        if (user.getRole() == Role.ADMIN) return Role.ADMIN;
        return ownershipRepository.findByUserAndDevice(user, device)
                .map(Ownership::getRole)
                .orElse(Role.VIEWER);
    }

    @Transactional
    public DeviceDto onboardDevice(OnboardRequest request, User user, String sourceIp) {
        String token = request.getClaimToken().trim();
        Device device = deviceRepository.findByClaimToken(token)
                .orElseThrow(() -> new BadRequestException("Mã Claim Token không hợp lệ hoặc không tồn tại"));

        if (device.getLifecycleState() == LifecycleState.ACTIVE) {
            throw new BadRequestException("Thiết bị này đã được kích hoạt trước đó");
        }
        if (device.getLifecycleState() == LifecycleState.DECOMMISSIONED) {
            throw new BadRequestException("Thiết bị đã bị vô hiệu hoá vĩnh viễn");
        }

        device.setName(request.getName().trim());
        if (request.getLicensePlate() != null && !request.getLicensePlate().isBlank()) {
            device.setLicensePlate(request.getLicensePlate().trim());
        }
        if (request.getVehicleModel() != null && !request.getVehicleModel().isBlank()) {
            device.setVehicleModel(request.getVehicleModel().trim());
        }

        device.setLifecycleState(LifecycleState.ACTIVE);
        device.setClaimToken(null); // Invalidate claim token after onboarding
        deviceRepository.save(device);

        // Create Ownership
        String ownershipId = "own-" + UUID.randomUUID().toString().substring(0, 8);
        Ownership ownership = new Ownership(ownershipId, user, device, Role.OWNER);
        ownershipRepository.save(ownership);

        auditLogService.log(user, device, "DEVICE_ONBOARD", "SUCCESS",
                "Kích hoạt thành công thiết bị " + device.getName() + " (" + device.getDeviceUuid() + ")", sourceIp);

        return new DeviceDto(device, Role.OWNER);
    }

    @Transactional
    public DeviceDto updateConfig(String deviceId, DeviceConfigRequest request, User user, String sourceIp) {
        Device device = getDeviceEntityChecked(deviceId, user, true);

        if (request.getName() != null && !request.getName().isBlank()) {
            device.setName(request.getName().trim());
        }
        if (request.getLicensePlate() != null) {
            device.setLicensePlate(request.getLicensePlate().trim());
        }
        if (request.getVehicleModel() != null) {
            device.setVehicleModel(request.getVehicleModel().trim());
        }
        if (request.getSpeedThresholdKmh() != null && request.getSpeedThresholdKmh() > 0) {
            device.setSpeedThresholdKmh(request.getSpeedThresholdKmh());
        }
        if (request.getBatteryLowThresholdV() != null && request.getBatteryLowThresholdV() > 0) {
            device.setBatteryLowThresholdV(request.getBatteryLowThresholdV());
        }
        if (request.getTiltThresholdDeg() != null && request.getTiltThresholdDeg() > 0) {
            device.setTiltThresholdDeg(request.getTiltThresholdDeg());
        }

        deviceRepository.save(device);

        auditLogService.log(user, device, "UPDATE_CONFIG", "SUCCESS",
                "Cập nhật cấu hình ngưỡng thiết bị " + device.getName(), sourceIp);

        return new DeviceDto(device, getUserRoleForDevice(user, device));
    }

    @Transactional
    public void inviteViewer(String deviceId, InviteUserRequest request, User user, String sourceIp) {
        Device device = getDeviceEntityChecked(deviceId, user, true);

        User viewerUser = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng với email: " + request.getEmail()));

        if (viewerUser.getUserId().equals(user.getUserId())) {
            throw new BadRequestException("Không thể tự mời chính mình làm Viewer");
        }

        Optional<Ownership> existing = ownershipRepository.findByUserAndDevice(viewerUser, device);
        if (existing.isPresent()) {
            Ownership o = existing.get();
            o.setRole(request.getRole() != null ? request.getRole() : Role.VIEWER);
            ownershipRepository.save(o);
        } else {
            String ownershipId = "own-" + UUID.randomUUID().toString().substring(0, 8);
            Ownership ownership = new Ownership(ownershipId, viewerUser, device,
                    request.getRole() != null ? request.getRole() : Role.VIEWER);
            ownershipRepository.save(ownership);
        }

        auditLogService.log(user, device, "INVITE_USER", "SUCCESS",
                "Cấp quyền " + request.getRole() + " cho " + viewerUser.getEmail() + " trên thiết bị " + device.getName(), sourceIp);
    }

    @Transactional
    public DeviceDto revokeDevice(String deviceId, User user, String sourceIp) {
        Device device = getDeviceEntityChecked(deviceId, user, true);

        device.setLifecycleState(LifecycleState.FAULT);
        device.setMqttPasswordHash(null); // Disable MQTT credentials
        deviceRepository.save(device);

        auditLogService.log(user, device, "DEVICE_REVOKED", "SUCCESS",
                "Thu hồi quyền kết nối của thiết bị " + device.getName(), sourceIp);

        return new DeviceDto(device, getUserRoleForDevice(user, device));
    }

    @Transactional
    public DeviceDto decommissionDevice(String deviceId, User user, String sourceIp) {
        Device device = getDeviceEntityChecked(deviceId, user, true);

        device.setLifecycleState(LifecycleState.DECOMMISSIONED);
        device.setMqttPasswordHash(null);
        deviceRepository.save(device);

        auditLogService.log(user, device, "DEVICE_DECOMMISSIONED", "SUCCESS",
                "Ngừng sử dụng vĩnh viễn thiết bị " + device.getName(), sourceIp);

        return new DeviceDto(device, getUserRoleForDevice(user, device));
    }

    @Transactional(readOnly = true)
    public List<UserDto> getDeviceUsers(String deviceId, User user) {
        Device device = getDeviceEntityChecked(deviceId, user, false);
        return ownershipRepository.findByDevice(device).stream()
                .map(o -> {
                    UserDto dto = new UserDto(o.getUser());
                    dto.setRole(o.getRole());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeUserFromDevice(String deviceId, String targetUserId, User user, String sourceIp) {
        Device device = getDeviceEntityChecked(deviceId, user, true);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        ownershipRepository.deleteByUserAndDevice(targetUser, device);

        auditLogService.log(user, device, "REMOVE_DEVICE_USER", "SUCCESS",
                "Gỡ quyền truy cập của người dùng " + targetUser.getEmail() + " khỏi thiết bị " + device.getName(), sourceIp);
    }

    @Transactional(readOnly = true)
    public List<DeviceDto> getAllDevicesAdmin() {
        return deviceRepository.findAll().stream()
                .map(d -> new DeviceDto(d, Role.ADMIN))
                .collect(Collectors.toList());
    }
}
