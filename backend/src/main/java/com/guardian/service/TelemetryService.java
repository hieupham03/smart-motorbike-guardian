package com.guardian.service;

import com.guardian.dto.TelemetryDto;
import com.guardian.entity.Device;
import com.guardian.entity.LifecycleState;
import com.guardian.entity.TelemetryReading;
import com.guardian.entity.User;
import com.guardian.repository.DeviceRepository;
import com.guardian.repository.TelemetryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TelemetryService {

    @Autowired
    private TelemetryRepository telemetryRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private DeviceService deviceService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public TelemetryDto recordTelemetry(String deviceId, TelemetryDto dto) {
        Device device = deviceRepository.findById(deviceId).orElse(null);
        if (device == null) {
            return null;
        }

        if (device.getLifecycleState() == LifecycleState.DECOMMISSIONED) {
            return null;
        }

        // Auto recover from OFFLINE to ACTIVE on receiving telemetry
        if (device.getLifecycleState() == LifecycleState.OFFLINE || device.getLifecycleState() == LifecycleState.REGISTERED) {
            device.setLifecycleState(LifecycleState.ACTIVE);
        }

        if (dto.getSpeedKmh() != null) device.setLastSpeedKmh(dto.getSpeedKmh());
        if (dto.getBatteryV() != null) device.setLastBatteryV(dto.getBatteryV());
        if (dto.getLatitude() != null) device.setLastLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) device.setLastLongitude(dto.getLongitude());
        device.setLastSeenAt(Instant.now());

        deviceRepository.save(device);

        String readingId = "tel-" + UUID.randomUUID().toString().substring(0, 8);
        long ts = dto.getTs() != null ? dto.getTs() : Instant.now().getEpochSecond();

        TelemetryReading reading = new TelemetryReading(
                readingId,
                device,
                dto.getSpeedKmh() != null ? dto.getSpeedKmh() : 0.0,
                dto.getBatteryV() != null ? dto.getBatteryV() : 12.6,
                dto.getAccelX() != null ? dto.getAccelX() : 0.0,
                dto.getAccelY() != null ? dto.getAccelY() : 0.0,
                dto.getAccelZ() != null ? dto.getAccelZ() : 1.0,
                dto.getLatitude() != null ? dto.getLatitude() : device.getLastLatitude(),
                dto.getLongitude() != null ? dto.getLongitude() : device.getLastLongitude(),
                dto.getState() != null ? dto.getState() : device.getSecurityState().name(),
                ts
        );

        telemetryRepository.save(reading);

        TelemetryDto resultDto = new TelemetryDto(reading);

        // Push real-time to WebSocket if available
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/devices/" + deviceId + "/telemetry", resultDto);
            } catch (Exception ignored) {}
        }

        return resultDto;
    }

    @Transactional(readOnly = true)
    public List<TelemetryDto> getTelemetryHistory(String deviceId, Long fromTs, Long toTs, User user) {
        Device device = deviceService.getDeviceEntityChecked(deviceId, user, false);

        if (fromTs == null) {
            fromTs = Instant.now().minusSeconds(86400).getEpochSecond(); // Default past 24 hours
        }
        if (toTs == null) {
            toTs = Instant.now().getEpochSecond();
        }

        List<TelemetryReading> readings = telemetryRepository.findByDeviceAndTsRange(device, fromTs, toTs);
        if (readings.isEmpty()) {
            readings = telemetryRepository.findTop50ByDeviceOrderByTsDesc(device);
        }

        return readings.stream()
                .map(TelemetryDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] exportCsv(String deviceId, Long fromTs, Long toTs, User user) {
        List<TelemetryDto> data = getTelemetryHistory(deviceId, fromTs, toTs, user);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8);

        // CSV Header
        writer.println("ReadingID,Timestamp,DateTimeUTC,Speed_kmh,Battery_V,Accel_X,Accel_Y,Accel_Z,Security_State,Latitude,Longitude");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (TelemetryDto d : data) {
            String formattedDate = "";
            if (d.getTs() != null) {
                formattedDate = LocalDateTime.ofInstant(Instant.ofEpochSecond(d.getTs()), ZoneId.of("UTC")).format(formatter);
            }
            writer.printf("%s,%d,%s,%.2f,%.2f,%.2f,%.2f,%.2f,%s,%.6f,%.6f%n",
                    d.getReadingId() != null ? d.getReadingId() : "",
                    d.getTs() != null ? d.getTs() : 0,
                    formattedDate,
                    d.getSpeedKmh() != null ? d.getSpeedKmh() : 0.0,
                    d.getBatteryV() != null ? d.getBatteryV() : 0.0,
                    d.getAccelX() != null ? d.getAccelX() : 0.0,
                    d.getAccelY() != null ? d.getAccelY() : 0.0,
                    d.getAccelZ() != null ? d.getAccelZ() : 1.0,
                    d.getState() != null ? d.getState() : "",
                    d.getLatitude() != null ? d.getLatitude() : 0.0,
                    d.getLongitude() != null ? d.getLongitude() : 0.0
            );
        }

        writer.flush();
        return out.toByteArray();
    }
}
