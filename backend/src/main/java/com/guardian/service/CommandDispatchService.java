package com.guardian.service;

import com.guardian.entity.*;
import com.guardian.repository.CommandRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

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
            String payload = new ObjectMapper().writeValueAsString(Map.of("cmd_id", id, "type", command.getType().name()));
            if (!mqtt.publishCommand(command.getDevice().getDeviceUuid(), command.getType().name(), payload)) lifecycle.failPublish(id);
        } catch (Exception e) { lifecycle.failPublish(id); }
    }
}
