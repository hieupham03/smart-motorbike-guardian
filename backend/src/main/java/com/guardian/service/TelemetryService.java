package com.guardian.service;

import com.guardian.dto.TelemetryDto;
import com.guardian.entity.*;
import com.guardian.exception.BadRequestException;
import com.guardian.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class TelemetryService {
    private final TelemetryRepository readings;
    private final DeviceRepository devices;
    private final DeviceService access;
    private final RealtimeService realtime;
    public TelemetryService(TelemetryRepository readings, DeviceRepository devices, DeviceService access, RealtimeService realtime) {
        this.readings = readings; this.devices = devices; this.access = access; this.realtime = realtime;
    }
    public static Double finite(Double value) { return value != null && Double.isFinite(value) ? value : null; }
    public static boolean coordinates(Double lat, Double lon) {
        return finite(lat) != null && finite(lon) != null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
    }

    @Transactional public TelemetryDto recordTelemetry(String id, TelemetryDto dto) {
        Device device = devices.findLockedById(id).orElseGet(() -> devices.findLockedByUuid(id).orElse(null));
        if (device == null || device.getLifecycleState() == LifecycleState.DECOMMISSIONED || device.getLifecycleState() == LifecycleState.FAULT) return null;
        String source = "SIMULATED".equals(dto.getDataSource()) ? "SIMULATED" : "HARDWARE";
        if (!source.equals(device.getDataSource())) return null;
        Instant now = Instant.now();
        boolean sensor = Boolean.TRUE.equals(dto.getSensorConnected());
        boolean speedValid = sensor && Boolean.TRUE.equals(dto.getSpeedValid()) && finite(dto.getSpeedKmh()) != null && dto.getSpeedKmh() >= 0;
        boolean imuValid = sensor && Boolean.TRUE.equals(dto.getImuValid()) && finite(dto.getAccelX()) != null && finite(dto.getAccelY()) != null && finite(dto.getAccelZ()) != null;
        boolean gpsValid = sensor && Boolean.TRUE.equals(dto.getGpsValid()) && coordinates(dto.getLatitude(), dto.getLongitude())
                && dto.getGpsAgeMs() != null && dto.getGpsAgeMs() >= 0 && dto.getGpsAgeMs() <= 5000;
        device.setSensorConnected(sensor); device.setSpeedValid(speedValid); device.setImuValid(imuValid); device.setGpsValid(gpsValid);
        device.setGpsAgeMs(dto.getGpsAgeMs()); device.setLastSeenAt(now); device.setLastTelemetryAt(now);
        device.setLastSpeedKmh(speedValid ? dto.getSpeedKmh() : null); device.setLastBatteryV(finite(dto.getBatteryV()));
        if (gpsValid) {
            device.setLastLatitude(dto.getLatitude()); device.setLastLongitude(dto.getLongitude()); device.setLastLocationReceivedAt(now);
        }
        if (dto.getState() != null) {
            try { device.setSecurityState(SecurityState.valueOf(dto.getState())); } catch (IllegalArgumentException ignored) {}
        }
        if (device.getLifecycleState() == LifecycleState.OFFLINE || device.getLifecycleState() == LifecycleState.REGISTERED)
            device.setLifecycleState(LifecycleState.ACTIVE);
        devices.save(device);
        TelemetryReading reading = new TelemetryReading(UUID.randomUUID().toString(), device, device.getLastSpeedKmh(), device.getLastBatteryV(),
                imuValid ? dto.getAccelX() : null, imuValid ? dto.getAccelY() : null, imuValid ? dto.getAccelZ() : null,
                gpsValid ? dto.getLatitude() : null, gpsValid ? dto.getLongitude() : null, device.getSecurityState().name(), now.getEpochSecond());
        reading.setDataSource(source); reading.setSensorConnected(sensor); reading.setSpeedValid(speedValid); reading.setImuValid(imuValid);
        reading.setGpsValid(gpsValid); reading.setGpsAgeMs(dto.getGpsAgeMs()); reading.setDeviceUptimeS(dto.getDeviceUptimeS()); reading.setReceivedAt(now);
        readings.save(reading);
        TelemetryDto result = new TelemetryDto(reading);
        realtime.publish(device, "TELEMETRY", result); realtime.publish(device, "DEVICE", null);
        return result;
    }

    @Transactional(readOnly = true) public TelemetryDto getLatest(String id, User user) {
        return readings.findFirstByDeviceOrderByTsDescCreatedAtDesc(access.getDeviceEntityChecked(id, user, false)).map(TelemetryDto::new).orElse(null);
    }

    @Transactional(readOnly = true) public List<TelemetryDto> getTelemetryHistory(String id, Long from, Long to, User user) {
        return getTelemetryHistory(id, from, to, user, 0, 5000);
    }

    @Transactional(readOnly = true) public List<TelemetryDto> getTelemetryHistory(String id, Long from, Long to, User user, int page, int size) {
        Device device = access.getDeviceEntityChecked(id, user, false);
        long end = to != null ? to : Instant.now().getEpochSecond(); long start = from != null ? from : end - 86400;
        if (start > end) throw new BadRequestException("from phải nhỏ hơn hoặc bằng to");
        if (page < 0 || size < 1 || size > 5000) throw new BadRequestException("page >= 0; size từ 1 đến 5000");
        var rows = readings.findByDeviceAndTsBetweenOrderByTsDescCreatedAtDesc(device, start, end, PageRequest.of(page, size));
        java.util.Collections.reverse(rows);
        return rows.stream().map(TelemetryDto::new).toList();
    }

    @Transactional(readOnly = true) public byte[] exportCsv(String id, Long from, Long to, User user) {
        StringBuilder csv = new StringBuilder("ReadingID,ReceivedAt,DeviceUptimeS,Source,SensorConnected,SpeedValid,ImuValid,GpsValid,GpsAgeMs,Speed_kmh,Battery_V,Accel_X,Accel_Y,Accel_Z,State,Latitude,Longitude\n");
        for (var d : getTelemetryHistory(id, from, to, user)) {
            Object[] values = {d.getReadingId(), d.getReceivedAt(), d.getDeviceUptimeS(), d.getDataSource(), d.getSensorConnected(), d.getSpeedValid(), d.getImuValid(), d.getGpsValid(), d.getGpsAgeMs(), d.getSpeedKmh(), d.getBatteryV(), d.getAccelX(), d.getAccelY(), d.getAccelZ(), d.getState(), d.getLatitude(), d.getLongitude()};
            csv.append(java.util.Arrays.stream(values).map(v -> v == null ? "" : v.toString()).collect(java.util.stream.Collectors.joining(","))).append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }
}
