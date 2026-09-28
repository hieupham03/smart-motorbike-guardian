package com.guardian.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "devices")
public class Device {

    @Id
    @Column(name = "device_id", length = 36)
    private String deviceId;

    @Column(name = "device_uuid", nullable = false, unique = true, length = 64)
    private String deviceUuid;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "license_plate", length = 50)
    private String licensePlate;

    @Column(name = "vehicle_model", length = 100)
    private String vehicleModel;

    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_state", nullable = false, length = 50)
    private LifecycleState lifecycleState = LifecycleState.REGISTERED;

    @Enumerated(EnumType.STRING)
    @Column(name = "security_state", nullable = false, length = 50)
    private SecurityState securityState = SecurityState.PARKED;

    @Column(name = "firmware_version", length = 50)
    private String firmwareVersion = "v1.0.0";

    @Column(name = "hw_version", length = 50)
    private String hwVersion = "ESP32-DualNode";

    @Column(name = "claim_token", length = 64)
    private String claimToken;

    @Column(name = "claim_token_expiry")
    private Instant claimTokenExpiry;

    @Column(name = "mqtt_username", length = 100)
    private String mqttUsername;

    @Column(name = "mqtt_password_hash", length = 255)
    private String mqttPasswordHash;

    @Column(name = "last_speed_kmh")
    private Double lastSpeedKmh = 0.0;

    @Column(name = "last_battery_v")
    private Double lastBatteryV = 12.6;

    @Column(name = "last_latitude")
    private Double lastLatitude = 21.028511;

    @Column(name = "last_longitude")
    private Double lastLongitude = 105.854444;

    @Column(name = "speed_threshold_kmh")
    private Double speedThresholdKmh = 80.0;

    @Column(name = "battery_low_threshold_v")
    private Double batteryLowThresholdV = 11.5;

    @Column(name = "tilt_threshold_deg")
    private Double tiltThresholdDeg = 45.0;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Device() {}

    public Device(String deviceId, String deviceUuid, String name, String licensePlate, String vehicleModel) {
        this.deviceId = deviceId;
        this.deviceUuid = deviceUuid;
        this.name = name;
        this.licensePlate = licensePlate;
        this.vehicleModel = vehicleModel;
        this.lifecycleState = LifecycleState.REGISTERED;
        this.securityState = SecurityState.PARKED;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
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

    public Instant getClaimTokenExpiry() { return claimTokenExpiry; }
    public void setClaimTokenExpiry(Instant claimTokenExpiry) { this.claimTokenExpiry = claimTokenExpiry; }

    public String getMqttUsername() { return mqttUsername; }
    public void setMqttUsername(String mqttUsername) { this.mqttUsername = mqttUsername; }

    public String getMqttPasswordHash() { return mqttPasswordHash; }
    public void setMqttPasswordHash(String mqttPasswordHash) { this.mqttPasswordHash = mqttPasswordHash; }

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

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
