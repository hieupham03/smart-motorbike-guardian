package com.guardian.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DeviceRegistrationRequest(
    @NotBlank @Size(max=255) String name,
    @Size(max=64) String deviceUuid,
    @Size(max=50) String hwVersion,
    @Size(max=50) String firmwareVersion,
    @Pattern(regexp="HARDWARE|SIMULATED") String dataSource) {}
