package com.guardian.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "telemetry_readings", indexes = {
    @Index(name = "idx_telemetry_device_ts", columnList = "device_id, ts")
})
public class TelemetryReading {
    private String dataSource;
    private Boolean sensorConnected;
    private Boolean imuValid;
    private Boolean speedValid;
    private Boolean gpsValid;
    private Long gpsAgeMs;
    @Column(name = "device_uptime_s")
    private Long deviceUptimeS;
    private java.time.Instant receivedAt;

    @Id
    @Column(name = "reading_id", length = 36)
    private String readingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "speed_kmh")
    private Double speedKmh;

    @Column(name = "battery_v")
    private Double batteryV;

    @Column(name = "accel_x")
    private Double accelX;

    @Column(name = "accel_y")
    private Double accelY;

    @Column(name = "accel_z")
    private Double accelZ;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(length = 50)
    private String state = "PARKED";

    @Column(nullable = false)
    private Long ts; // Unix epoch seconds

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public TelemetryReading() {}

    public TelemetryReading(String readingId, Device device, Double speedKmh, Double batteryV, Double accelX, Double accelY, Double accelZ, Double latitude, Double longitude, String state, Long ts) {
        this.readingId = readingId;
        this.device = device;
        this.speedKmh = speedKmh;
        this.batteryV = batteryV;
        this.accelX = accelX;
        this.accelY = accelY;
        this.accelZ = accelZ;
        this.latitude = latitude;
        this.longitude = longitude;
        this.state = state;
        this.ts = ts;
        this.createdAt = Instant.now();
    }

    public String getReadingId() { return readingId; }
    public void setReadingId(String readingId) { this.readingId = readingId; }

    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }

    public Double getSpeedKmh() { return speedKmh; }
    public void setSpeedKmh(Double speedKmh) { this.speedKmh = speedKmh; }

    public Double getBatteryV() { return batteryV; }
    public void setBatteryV(Double batteryV) { this.batteryV = batteryV; }

    public Double getAccelX() { return accelX; }
    public void setAccelX(Double accelX) { this.accelX = accelX; }

    public Double getAccelY() { return accelY; }
    public void setAccelY(Double accelY) { this.accelY = accelY; }

    public Double getAccelZ() { return accelZ; }
    public void setAccelZ(Double accelZ) { this.accelZ = accelZ; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Long getTs() { return ts; }
    public void setTs(Long ts) { this.ts = ts; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getDataSource() { return dataSource; }
    public void setDataSource(String value) { this.dataSource = value; }
    public Boolean getSensorConnected() { return sensorConnected; }
    public void setSensorConnected(Boolean value) { this.sensorConnected = value; }
    public Boolean getImuValid() { return imuValid; }
    public void setImuValid(Boolean value) { this.imuValid = value; }
    public Boolean getSpeedValid() { return speedValid; }
    public void setSpeedValid(Boolean value) { this.speedValid = value; }
    public Boolean getGpsValid() { return gpsValid; }
    public void setGpsValid(Boolean value) { this.gpsValid = value; }
    public Long getGpsAgeMs() { return gpsAgeMs; }
    public void setGpsAgeMs(Long value) { this.gpsAgeMs = value; }
    public Long getDeviceUptimeS() { return deviceUptimeS; }
    public void setDeviceUptimeS(Long value) { this.deviceUptimeS = value; }
    public java.time.Instant getReceivedAt() { return receivedAt; }
    public void setReceivedAt(java.time.Instant value) { this.receivedAt = value; }
}
