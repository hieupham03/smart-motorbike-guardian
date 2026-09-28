package com.guardian.dto;

public class DeviceConfigRequest {
    private String name;
    private String licensePlate;
    private String vehicleModel;
    private Double speedThresholdKmh;
    private Double batteryLowThresholdV;
    private Double tiltThresholdDeg;

    public DeviceConfigRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public Double getSpeedThresholdKmh() { return speedThresholdKmh; }
    public void setSpeedThresholdKmh(Double speedThresholdKmh) { this.speedThresholdKmh = speedThresholdKmh; }

    public Double getBatteryLowThresholdV() { return batteryLowThresholdV; }
    public void setBatteryLowThresholdV(Double batteryLowThresholdV) { this.batteryLowThresholdV = batteryLowThresholdV; }

    public Double getTiltThresholdDeg() { return tiltThresholdDeg; }
    public void setTiltThresholdDeg(Double tiltThresholdDeg) { this.tiltThresholdDeg = tiltThresholdDeg; }
}
