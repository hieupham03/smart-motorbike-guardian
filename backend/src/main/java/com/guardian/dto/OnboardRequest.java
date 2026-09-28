package com.guardian.dto;

import jakarta.validation.constraints.NotBlank;

public class OnboardRequest {

    @NotBlank(message = "Claim Token không được để trống")
    private String claimToken;

    @NotBlank(message = "Tên xe không được để trống")
    private String name;

    private String licensePlate;
    private String vehicleModel;

    public OnboardRequest() {}

    public OnboardRequest(String claimToken, String name, String licensePlate, String vehicleModel) {
        this.claimToken = claimToken;
        this.name = name;
        this.licensePlate = licensePlate;
        this.vehicleModel = vehicleModel;
    }

    public String getClaimToken() { return claimToken; }
    public void setClaimToken(String claimToken) { this.claimToken = claimToken; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }
}
