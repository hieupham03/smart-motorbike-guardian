package com.guardian.dto;

import com.guardian.entity.Device;
import com.guardian.entity.LifecycleState;
import com.guardian.entity.Role;
import com.guardian.entity.SecurityState;

import java.time.Instant;

public class DeviceDto {
    private String deviceId;
    private String deviceUuid;
    private String name;
    private String licensePlate;
    private String vehicleModel;
    private LifecycleState lifecycleState;
    private SecurityState securityState;
    private String firmwareVersion;
    private String hwVersion;
    private String claimToken;
    private Double lastSpeedKmh;
    private Double lastBatteryV;
    private Double lastLatitude;
    private Double lastLongitude;
    private Double speedThresholdKmh;
    private Double batteryLowThresholdV;
    private Double tiltThresholdDeg;
    private Instant lastSeenAt;
    private Instant createdAt;
    private Role currentUserRole; // OWNER or VIEWER for current user

    public DeviceDto() {}

    public DeviceDto(Device device) {
        if (device != null) {
            this.deviceId = device.getDeviceId();
            this.deviceUuid = device.getDeviceUuid();
            this.name = device.getName();
            this.licensePlate = device.getLicensePlate();
            this.vehicleModel = device.getVehicleModel();
            this.lifecycleState = device.getLifecycleState();
            this.securityState = device.getSecurityState();
            this.firmwareVersion = device.getFirmwareVersion();
            this.hwVersion = device.getHwVersion();
            this.claimToken = device.getClaimToken();
            this.lastSpeedKmh = device.getLastSpeedKmh();
            this.lastBatteryV = device.getLastBatteryV();
            this.lastLatitude = device.getLastLatitude();
            this.lastLongitude = device.getLastLongitude();
            this.speedThresholdKmh = device.getSpeedThresholdKmh();
            this.batteryLowThresholdV = device.getBatteryLowThresholdV();
            this.tiltThresholdDeg = device.getTiltThresholdDeg();
            this.lastSeenAt = device.getLastSeenAt();
            this.createdAt = device.getCreatedAt();
        }
    }

    public DeviceDto(Device device, Role role) {
        this(device);
        this.currentUserRole = role;
    }

    // Getters and Setters
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceUuid() { return deviceUuid; }
    public void setDeviceUuid(String deviceUuid) { this.deviceUuid = deviceUuid; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public LifecycleState getLifecycleState() { return lifecycleState; }
    public void setLifecycleState(LifecycleState lifecycleState) { this.lifecycleState = lifecycleState; }

    public SecurityState getSecurityState() { return securityState; }
    public void setSecurityState(SecurityState securityState) { this.securityState = securityState; }

    public String getFirmwareVersion() { return firmwareVersion; }
    public void setFirmwareVersion(String firmwareVersion) { this.firmwareVersion = firmwareVersion; }

    public String getHwVersion() { return hwVersion; }
    public void setHwVersion(String hwVersion) { this.hwVersion = hwVersion; }

    public String getClaimToken() { return claimToken; }
    public void setClaimToken(String claimToken) { this.claimToken = claimToken; }

    public Double getLastSpeedKmh() { return lastSpeedKmh; }
    public void setLastSpeedKmh(Double lastSpeedKmh) { this.lastSpeedKmh = lastSpeedKmh; }

    public Double getLastBatteryV() { return lastBatteryV; }
    public void setLastBatteryV(Double lastBatteryV) { this.lastBatteryV = lastBatteryV; }

    public Double getLastLatitude() { return lastLatitude; }
    public void setLastLatitude(Double lastLatitude) { this.lastLatitude = lastLatitude; }

    public Double getLastLongitude() { return lastLongitude; }
    public void setLastLongitude(Double lastLongitude) { this.lastLongitude = lastLongitude; }

    public Double getSpeedThresholdKmh() { return speedThresholdKmh; }
    public void setSpeedThresholdKmh(Double speedThresholdKmh) { this.speedThresholdKmh = speedThresholdKmh; }

    public Double getBatteryLowThresholdV() { return batteryLowThresholdV; }
    public void setBatteryLowThresholdV(Double batteryLowThresholdV) { this.batteryLowThresholdV = batteryLowThresholdV; }

    public Double getTiltThresholdDeg() { return tiltThresholdDeg; }
    public void setTiltThresholdDeg(Double tiltThresholdDeg) { this.tiltThresholdDeg = tiltThresholdDeg; }

    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Role getCurrentUserRole() { return currentUserRole; }
    public void setCurrentUserRole(Role currentUserRole) { this.currentUserRole = currentUserRole; }
}
