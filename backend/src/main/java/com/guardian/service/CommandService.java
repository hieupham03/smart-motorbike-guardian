package com.guardian.service;

import com.guardian.dto.CommandRequest;
import com.guardian.dto.CommandResponse;
import com.guardian.entity.*;
import com.guardian.exception.BadRequestException;
import com.guardian.exception.ForbiddenException;
import com.guardian.exception.ResourceNotFoundException;
import com.guardian.repository.CommandRepository;
import com.guardian.repository.DeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CommandService {

    private static final Logger log = LoggerFactory.getLogger(CommandService.class);

    @Autowired
    private CommandRepository commandRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private MqttSubscriberService mqttSubscriberService;

    @Autowired
    private VirtualDeviceSimulatorService simulatorService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public CommandResponse sendCommand(String deviceId, CommandRequest request, User user, String sourceIp) {
        Device device = deviceService.getDeviceEntityChecked(deviceId, user, true); // Require Owner or Admin (Viewer rejected 403)

        if (device.getLifecycleState() == LifecycleState.DECOMMISSIONED) {
            throw new BadRequestException("Không thể gửi lệnh tới thiết bị đã ngừng sử dụng (Decommissioned)");
        }
        if (device.getLifecycleState() == LifecycleState.FAULT) {
            throw new BadRequestException("Thiết bị đang ở trạng thái lỗi/thu hồi (Revoked), không thể nhận lệnh");
        }

        // Step-up confirmation for dangerous commands (LOCK_ENGINE)
        if (request.getType() == CommandType.LOCK_ENGINE) {
            if (request.getConfirmationPassword() == null || request.getConfirmationPassword().isBlank()) {
                throw new BadRequestException("Lệnh khoá động cơ khẩn cấp yêu cầu xác thực mật khẩu (Step-up Confirmation)");
            }
            if (!passwordEncoder.matches(request.getConfirmationPassword(), user.getPasswordHash())) {
                auditLogService.log(user, device, "COMMAND_REJECTED_STEPUP", "FAILED", "Sai mật khẩu xác nhận khi khoá động cơ", sourceIp);
                throw new BadRequestException("Mật khẩu xác nhận không chính xác");
            }
        }

        String cmdId = "cmd-" + UUID.randomUUID().toString().substring(0, 8);
        Command command = new Command(cmdId, device, user, request.getType(), request.getPayload());
        commandRepository.save(command);

        auditLogService.log(user, device, "COMMAND_ISSUED", "PENDING",
                "Gửi lệnh " + request.getType().name() + " (" + cmdId + ")", sourceIp);

        // Prepare JSON payload for MQTT
        String payloadJson = String.format("{\"cmd_id\":\"%s\",\"type\":\"%s\",\"issued_by\":\"%s\",\"ts\":%d}",
                cmdId, request.getType().name(), user.getUserId(), Instant.now().getEpochSecond());

        boolean mqttSent = mqttSubscriberService.publishCommand(deviceId, request.getType().name(), payloadJson);

        if (!mqttSent) {
            // Broker unavailable or fallback: trigger virtual device simulator immediately
            log.info("MQTT publish not available, delegating command [{}] to virtual testbed simulator", cmdId);
            simulatorService.handleCommandSimulated(command);
        }

        return new CommandResponse(command);
    }

    @Transactional
    public void processCommandAck(String cmdId, String result, String reasonIfFailed) {
        Command command = commandRepository.findById(cmdId).orElse(null);
        if (command == null) {
            log.warn("Received ACK for unknown cmd_id: {}", cmdId);
            return;
        }

        CommandStatus newStatus = "EXECUTED".equalsIgnoreCase(result) ? CommandStatus.EXECUTED : CommandStatus.REJECTED;
        command.setStatus(newStatus);
        command.setReasonIfFailed(reasonIfFailed);
        command.setAckAt(Instant.now());
        commandRepository.save(command);

        Device device = command.getDevice();
        if (device != null) {
            if (newStatus == CommandStatus.EXECUTED) {
                if (command.getType() == CommandType.ARM) {
                    device.setSecurityState(SecurityState.ARMED);
                } else if (command.getType() == CommandType.DISARM || command.getType() == CommandType.UNLOCK_ENGINE) {
                    device.setSecurityState(SecurityState.PARKED);
                } else if (command.getType() == CommandType.LOCK_ENGINE) {
                    device.setSecurityState(SecurityState.THEFT_LOCK);
                }
                deviceRepository.save(device);
            }

            auditLogService.log(command.getIssuedBy(), device, "COMMAND_ACK", newStatus.name(),
                    "Phản hồi lệnh " + command.getType() + ": " + newStatus.name() +
                            (reasonIfFailed != null ? " (" + reasonIfFailed + ")" : ""), "DEVICE_HARDWARE");
        }

        CommandResponse response = new CommandResponse(command);

        if (messagingTemplate != null && device != null) {
            try {
                messagingTemplate.convertAndSend("/topic/devices/" + device.getDeviceId() + "/commands", response);
            } catch (Exception ignored) {}
        }
    }

    @Transactional(readOnly = true)
    public List<CommandResponse> getCommandsForDevice(String deviceId, User user) {
        Device device = deviceService.getDeviceEntityChecked(deviceId, user, false);
        return commandRepository.findByDeviceOrderByIssuedAtDesc(device).stream()
                .map(CommandResponse::new)
                .collect(Collectors.toList());
    }
}
