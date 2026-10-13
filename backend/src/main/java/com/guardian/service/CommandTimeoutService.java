package com.guardian.service;

import com.guardian.entity.CommandStatus;
import com.guardian.repository.CommandRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Instant;

@Service
public class CommandTimeoutService {
    private final CommandRepository commands;
    private final CommandService lifecycle;
    @Value("${app.realtime.command-timeout-seconds:10}") private long timeout;
    public CommandTimeoutService(CommandRepository commands, CommandService lifecycle) { this.commands = commands; this.lifecycle = lifecycle; }
    @Scheduled(fixedDelay = 1000) public void expire() {
        Instant cutoff = Instant.now().minusSeconds(timeout);
        commands.findByStatusAndIssuedAtBefore(CommandStatus.PENDING, cutoff).forEach(c -> lifecycle.timeout(c.getCmdId(), cutoff));
    }
}
