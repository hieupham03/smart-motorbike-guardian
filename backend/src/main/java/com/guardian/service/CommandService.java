package com.guardian.service;

import com.guardian.dto.CommandRequest;
import com.guardian.dto.CommandResponse;
import com.guardian.entity.*;
import com.guardian.exception.BadRequestException;
import com.guardian.repository.CommandRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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
    private DeviceService deviceService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RealtimeService realtime;

    @Autowired
    private PushNotificationService push;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private CommandDispatchService dispatch;

    @Transactional
    public CommandResponse sendCommand(String deviceId, CommandRequest request, User user, String sourceIp) {
        Device device = deviceService.getDeviceEntityChecked(deviceId, user, true); // Require Owner or Admin (Viewer rejected 403)

        if (device.getLifecycleState() == LifecycleState.DECOMMISSIONED) {
            throw new BadRequestException("Không thể gửi lệnh tới thiết bị đã ngừng sử dụng (Decommissioned)");
        }
        if (device.getLifecycleState() == LifecycleState.FAULT) {
            throw new BadRequestException("Thiết bị đang ở trạng thái lỗi/thu hồi (Revoked), không thể nhận lệnh");
        }

        if (request.getType() == null || request.getType() == CommandType.CONFIG_THRESHOLDS)
            throw new BadRequestException("Lệnh không được firmware hiện tại hỗ trợ");

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

        String cmdId = UUID.randomUUID().toString();
        Command command = new Command(cmdId, device, user, request.getType(), request.getPayload());
        commandRepository.save(command);

        auditLogService.log(user, device, "COMMAND_ISSUED", "PENDING",
                "Gửi lệnh " + request.getType().name() + " (" + cmdId + ")", sourceIp);

        realtime.publish(device, "COMMAND", new CommandResponse(command));
        realtime.afterCommit(() -> dispatch.dispatch(cmdId));

        return new CommandResponse(command);
    }

    @Transactional
    public void processCommandAck(String deviceId, String cmdId, String result, String reason) {
        Command command = commandRepository.findLockedById(cmdId).orElse(null);
        if (command == null || !(command.getDevice().getDeviceUuid().equals(deviceId) || command.getDevice().getDeviceId().equals(deviceId))) return;
        if (!"EXECUTED".equals(result) && !"REJECTED".equals(result)) return;
        if (command.getStatus() == CommandStatus.TIMEOUT) {
            if (command.getLateAckAt() != null) return;
            command.setLateAckAt(Instant.now()); command.setLateAckResult(result); command.setLateAckReason(reason);
        } else if (command.getStatus() == CommandStatus.PENDING) {
            command.setStatus(CommandStatus.valueOf(result)); command.setReasonIfFailed(reason); command.setAckAt(Instant.now());
        } else return;
        commandRepository.save(command);
        auditLogService.log(command.getIssuedBy(), command.getDevice(), "COMMAND_ACK", result,
                "ACK " + cmdId + (command.getStatus() == CommandStatus.TIMEOUT ? " (late)" : ""), "DEVICE");
        // Device security state comes from telemetry; siren commands need not alter it.
        realtime.publish(command.getDevice(), "COMMAND", new CommandResponse(command));
        notifyTerminal(command);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void failPublish(String id) {
        Command command = commandRepository.findLockedById(id).orElse(null);
        if (command == null || command.getStatus() != CommandStatus.PENDING) return;
        command.setStatus(CommandStatus.REJECTED); command.setReasonIfFailed("MQTT_UNAVAILABLE");
        commandRepository.save(command);
        realtime.publish(command.getDevice(), "COMMAND", new CommandResponse(command));
        notifyTerminal(command);
    }

    @Transactional
    public void timeout(String id, Instant cutoff) {
        Command command = commandRepository.findLockedById(id).orElse(null);
        if (command == null || command.getStatus() != CommandStatus.PENDING || !command.getIssuedAt().isBefore(cutoff)) return;
        command.setStatus(CommandStatus.TIMEOUT); command.setReasonIfFailed("ACK_TIMEOUT");
        commandRepository.save(command);
        realtime.publish(command.getDevice(), "COMMAND", new CommandResponse(command));
        notifyTerminal(command);
    }

    @Transactional(readOnly = true)
    public List<CommandResponse> getCommandsForDevice(String deviceId, User user) {
        Device device = deviceService.getDeviceEntityChecked(deviceId, user, false);
        return commandRepository.findTop100ByDeviceOrderByIssuedAtDesc(device).stream()
                .map(CommandResponse::new)
                .collect(Collectors.toList());
    }

    private void notifyTerminal(Command command) {
        if (command.getStatus() == CommandStatus.PENDING) return;
        realtime.afterCommit(() -> push.notifyUser(command.getIssuedBy(), "command:" + command.getCmdId() + ":" + command.getStatus(),
                "Lệnh " + command.getType(), "Trạng thái: " + command.getStatus(),
                java.util.Map.of("type", "COMMAND", "deviceId", command.getDevice().getDeviceId(), "cmdId", command.getCmdId())));
    }
}
