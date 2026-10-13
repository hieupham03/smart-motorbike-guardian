package com.guardian.dto;

import com.guardian.entity.TelemetryReading;

public class TelemetryDto {
    private String dataSource;
    private Boolean sensorConnected;
    private Boolean imuValid;
    private Boolean speedValid;
    private Boolean gpsValid;
    private Long gpsAgeMs;
    private Long deviceUptimeS;
    private java.time.Instant receivedAt;
    private String readingId;
    private String deviceId;
    private Double speedKmh;
    private Double batteryV;
    private Double accelX;
    private Double accelY;
    private Double accelZ;
    private Double latitude;
    private Double longitude;
    private String state;
    private Long ts;

    public TelemetryDto() {}

    public TelemetryDto(TelemetryReading reading) {
        if (reading != null) {
            this.dataSource = reading.getDataSource();
            this.sensorConnected = reading.getSensorConnected();
            this.imuValid = reading.getImuValid();
            this.speedValid = reading.getSpeedValid();
            this.gpsValid = reading.getGpsValid();
            this.gpsAgeMs = reading.getGpsAgeMs();
            this.deviceUptimeS = reading.getDeviceUptimeS();
            this.receivedAt = reading.getReceivedAt();
            this.readingId = reading.getReadingId();
            if (reading.getDevice() != null) {
                this.deviceId = reading.getDevice().getDeviceId();
            }
            this.speedKmh = reading.getSpeedKmh();
            this.batteryV = reading.getBatteryV();
            this.accelX = reading.getAccelX();
            this.accelY = reading.getAccelY();
            this.accelZ = reading.getAccelZ();
            this.latitude = reading.getLatitude();
            this.longitude = reading.getLongitude();
            this.state = reading.getState();
            this.ts = reading.getTs();
        }
    }

    public String getReadingId() { return readingId; }
    public void setReadingId(String readingId) { this.readingId = readingId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

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
