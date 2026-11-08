package com.guardian.service;

import com.guardian.entity.*;
import com.guardian.repository.CommandRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommandDispatchService {
    private final CommandRepository commands;
    private final MqttSubscriberService mqtt;
    private final CommandService lifecycle;
    private final VirtualDeviceSimulatorService simulator;
    public CommandDispatchService(CommandRepository commands, @Lazy MqttSubscriberService mqtt, @Lazy CommandService lifecycle, @Lazy VirtualDeviceSimulatorService simulator) {
        this.commands = commands; this.mqtt = mqtt; this.lifecycle = lifecycle; this.simulator = simulator;
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatch(String id) {
        var command = commands.findById(id).orElseThrow();
        if (command.getStatus() != CommandStatus.PENDING) return;
        if ("SIMULATED".equals(command.getDevice().getDataSource())) {
            simulator.handleCommandSimulated(command);
            simulator.publishSnapshot(command.getDevice());
            return;
        }
        try {
            String payload = mqttPayload(command);
            if (!mqtt.publishCommand(command.getDevice().getDeviceUuid(), command.getType().name(), payload)) lifecycle.failPublish(id);
        } catch (Exception e) { lifecycle.failPublish(id); }
    }

    static String mqttPayload(Command command) throws com.fasterxml.jackson.core.JsonProcessingException {
        ObjectMapper json = new ObjectMapper();
        var payload = json.createObjectNode();
        payload.put("cmd_id", command.getCmdId());
        payload.put("type", command.getType().name());
        if (command.getType() == CommandType.CONFIG_THRESHOLDS)
            payload.set("speed_limit_kmh", SpeedLimitConfig.parse(command.getPayload()).get("speed_limit_kmh"));
        return json.writeValueAsString(payload);
    }
}
