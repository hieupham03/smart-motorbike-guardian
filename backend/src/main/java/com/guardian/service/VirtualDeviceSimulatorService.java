package com.guardian.service;

import com.guardian.dto.AlertDto;
import com.guardian.dto.TelemetryDto;
import com.guardian.entity.*;
import com.guardian.repository.DeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Random;

@Service
public class VirtualDeviceSimulatorService {

    private static final Logger log = LoggerFactory.getLogger(VirtualDeviceSimulatorService.class);

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    @Lazy
    private TelemetryService telemetryService;

    @Autowired
    @Lazy
    private AlertService alertService;

    @Autowired
    @Lazy
    private CommandService commandService;

    private final Random random = new Random();
    private boolean simulationEnabled = false; // Disabled by default to prioritize real hardware data

    public void handleCommandSimulated(Command command) {
        Device device = command.getDevice();
        if (device == null || !"SIMULATED".equals(device.getDataSource()))
            throw new com.guardian.exception.BadRequestException("Chỉ mô phỏng thiết bị SIMULATED");

        log.info("Simulating hardware execution for Command [{}] on device [{}]", command.getType(), device.getName());

        // Safety Constraint Simulation (FR-04, S-07): REJECT LOCK_ENGINE IF SPEED > 0
        if (command.getType() == CommandType.LOCK_ENGINE) {
            double currentSpeed = device.getLastSpeedKmh() != null ? device.getLastSpeedKmh() : 0.0;
            if (currentSpeed > 0.0) {
                log.warn("Safety constraint triggered: Engine lock rejected because vehicle speed is {} km/h > 0", currentSpeed);
                commandService.processCommandAck(device.getDeviceUuid(), command.getCmdId(), "REJECTED", "SPEED_NOT_ZERO");
                return;
            } else {
                device.setSecurityState(SecurityState.THEFT_LOCK);
                deviceRepository.save(device);
                commandService.processCommandAck(device.getDeviceUuid(), command.getCmdId(), "EXECUTED", null);
                return;
            }
        }

        if (command.getType() == CommandType.ARM) {
            device.setSecurityState(SecurityState.ARMED);
            deviceRepository.save(device);
            commandService.processCommandAck(device.getDeviceUuid(), command.getCmdId(), "EXECUTED", null);
            return;
        }

        if (command.getType() == CommandType.DISARM) {
            device.setSecurityState(SecurityState.PARKED);
            deviceRepository.save(device);
            commandService.processCommandAck(device.getDeviceUuid(), command.getCmdId(), "EXECUTED", null);
            return;
        }

        if (command.getType() == CommandType.UNLOCK_ENGINE) {
            device.setSecurityState(SecurityState.PARKED);
            deviceRepository.save(device);
            commandService.processCommandAck(device.getDeviceUuid(), command.getCmdId(), "EXECUTED", null);
            return;
        }

        // Default successful execution
        commandService.processCommandAck(device.getDeviceUuid(), command.getCmdId(), "EXECUTED", null);
    }

    /**
     * Periodic background generator for active demo devices
     */
    @Scheduled(fixedRate = 3000)
    public void generatePeriodicTelemetry() {
        if (!simulationEnabled) return;

        List<Device> activeDevices = deviceRepository.findByLifecycleState(LifecycleState.ACTIVE);
        for (Device device : activeDevices) {
            if (!"SIMULATED".equals(device.getDataSource())) continue;
            // Generate gentle real-time variations
            double baseSpeed = device.getLastSpeedKmh() != null ? device.getLastSpeedKmh() : 0.0;
            double baseBattery = device.getLastBatteryV() != null ? device.getLastBatteryV() : 12.6;

            // Jitter
            double jitterBattery = Math.max(11.0, Math.min(13.2, baseBattery + (random.nextDouble() - 0.5) * 0.05));
            double accelX = (random.nextDouble() - 0.5) * 0.1;
            double accelY = (random.nextDouble() - 0.5) * 0.1;
            double accelZ = 9.81 + (random.nextDouble() - 0.5) * 0.04;

            // Small location drift for realism
            double lat = device.getLastLatitude() != null ? device.getLastLatitude() : 21.028511;
            double lon = device.getLastLongitude() != null ? device.getLastLongitude() : 105.854444;
            if (baseSpeed > 0) {
                lat += (random.nextDouble() - 0.5) * 0.0001;
                lon += (random.nextDouble() - 0.5) * 0.0001;
            }

            TelemetryDto dto = new TelemetryDto();
            dto.setDataSource("SIMULATED"); dto.setSensorConnected(true); dto.setImuValid(true); dto.setSpeedValid(true); dto.setGpsValid(true); dto.setGpsAgeMs(0L);
            dto.setDeviceId(device.getDeviceId());
            dto.setSpeedKmh(baseSpeed);
            dto.setBatteryV(Math.round(jitterBattery * 100.0) / 100.0);
            dto.setAccelX(Math.round(accelX * 100.0) / 100.0);
            dto.setAccelY(Math.round(accelY * 100.0) / 100.0);
            dto.setAccelZ(Math.round(accelZ * 100.0) / 100.0);
            dto.setLatitude(lat);
            dto.setLongitude(lon);
            dto.setState(device.getSecurityState().name());
            dto.setTs(Instant.now().getEpochSecond());

            telemetryService.recordTelemetry(device.getDeviceId(), dto);
        }
    }

    /**
     * Manual simulation trigger from Web UI for interactive demonstrations
     */
    @Transactional
    public void simulateVehicleAction(String deviceId, String action, Double value) {
        Device device = deviceRepository.findById(deviceId).orElse(null);
        if (device == null) return;

        if (action == null) throw new com.guardian.exception.BadRequestException("Thiếu action");
        if (value != null && (!Double.isFinite(value) || value < 0)) throw new com.guardian.exception.BadRequestException("Giá trị không hợp lệ");
        switch (action.toUpperCase()) {
            case "SET_SPEED":
                double newSpeed = value != null ? value : 0.0;
                device.setLastSpeedKmh(newSpeed);
                deviceRepository.save(device);

                // If moving while ARMED -> trigger theft alert!
                if (newSpeed > 0 && device.getSecurityState() == SecurityState.ARMED) {
                    device.setSecurityState(SecurityState.ALARM);
                    deviceRepository.save(device);

                    AlertDto alertDto = new AlertDto();
                    alertDto.setDeviceId(deviceId);
                    alertDto.setDataSource("SIMULATED");
                    alertDto.setReason("MOTION_WHILE_ARMED");
                    alertDto.setSeverity(AlertSeverity.HIGH);
                    alertDto.setActionTaken("ALARM_TRIGGERED_BUZZER_ON");
                    alertDto.setDetails("Phát hiện chuyển động bánh xe (" + newSpeed + " km/h) khi hệ thống đang ở chế độ CANH GIỮ (ARMED)");
                    alertService.processAlert(deviceId, alertDto);
                }

                // If exceeding speed threshold -> trigger overspeed alert
                if (newSpeed > device.getSpeedThresholdKmh()) {
                    AlertDto alertDto = new AlertDto();
                    alertDto.setDeviceId(deviceId);
                    alertDto.setDataSource("SIMULATED");
                    alertDto.setReason("SPEED_LIMIT_EXCEEDED");
                    alertDto.setSeverity(AlertSeverity.MEDIUM);
                    alertDto.setActionTaken("SPEED_WARNING_LOGGED");
                    alertDto.setDetails("Tốc độ xe (" + newSpeed + " km/h) vượt ngưỡng an toàn cấu hình (" + device.getSpeedThresholdKmh() + " km/h)");
                    alertService.processAlert(deviceId, alertDto);
                }
                break;

            case "TRIGGER_FALL":
                AlertDto fallAlert = new AlertDto();
                fallAlert.setDeviceId(deviceId);
                fallAlert.setDataSource("SIMULATED");
                    fallAlert.setReason("FALL_DETECTED");
                fallAlert.setSeverity(AlertSeverity.CRITICAL);
                fallAlert.setActionTaken("EMERGENCY_NOTIFICATION_SENT");
                fallAlert.setDetails("Cảm biến MPU6050 phát hiện xe bị nghiêng > 55 độ hoặc va chạm mạnh!");
                alertService.processAlert(deviceId, fallAlert);
                break;

            case "SET_BATTERY":
                double newVolt = value != null ? value : 12.0;
                device.setLastBatteryV(newVolt);
                deviceRepository.save(device);

                if (newVolt < device.getBatteryLowThresholdV()) {
                    AlertDto batAlert = new AlertDto();
                    batAlert.setDeviceId(deviceId);
                    batAlert.setDataSource("SIMULATED");
                    batAlert.setReason("LOW_BATTERY");
                    batAlert.setSeverity(AlertSeverity.LOW);
                    batAlert.setActionTaken("BATTERY_SAVING_MODE");
                    batAlert.setDetails("Điện áp ắc quy yếu (" + newVolt + "V), thấp hơn ngưỡng " + device.getBatteryLowThresholdV() + "V");
                    alertService.processAlert(deviceId, batAlert);
                }
                break;

            case "TRIGGER_THEFT_TAMPER":
                AlertDto tamperAlert = new AlertDto();
                tamperAlert.setDeviceId(deviceId);
                tamperAlert.setDataSource("SIMULATED");
                    tamperAlert.setReason("SYSTEM_TAMPERING");
                tamperAlert.setSeverity(AlertSeverity.HIGH);
                tamperAlert.setActionTaken("LOCK_COMMAND_PREPARED");
                tamperAlert.setDetails("Cảnh báo phát hiện cố tình can thiệp mở khoá hoặc cắt nguồn vật lý.");
                alertService.processAlert(deviceId, tamperAlert);
                break;
            default: throw new com.guardian.exception.BadRequestException("Action không hỗ trợ");
        }
        publishSnapshot(device);
    }

    public void publishSnapshot(Device device) {
        TelemetryDto dto = new TelemetryDto();
        dto.setDataSource("SIMULATED"); dto.setSensorConnected(true); dto.setSpeedValid(true); dto.setImuValid(true);
        dto.setSpeedKmh(device.getLastSpeedKmh()); dto.setBatteryV(device.getLastBatteryV());
        dto.setAccelX(0.0); dto.setAccelY(0.0); dto.setAccelZ(9.81); dto.setState(device.getSecurityState().name());
        dto.setGpsValid(TelemetryService.coordinates(device.getLastLatitude(), device.getLastLongitude())); dto.setGpsAgeMs(0L);
        dto.setLatitude(device.getLastLatitude()); dto.setLongitude(device.getLastLongitude());
        telemetryService.recordTelemetry(device.getDeviceId(), dto);
    }

    public boolean isSimulationEnabled() { return simulationEnabled; }
    public void setSimulationEnabled(boolean simulationEnabled) { this.simulationEnabled = simulationEnabled; }
}
