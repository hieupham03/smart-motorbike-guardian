package com.guardian.controller;

import com.guardian.service.MqttSubscriberService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class HealthController {
    private final JdbcTemplate database;
    private final MqttSubscriberService mqtt;
    public HealthController(JdbcTemplate database, MqttSubscriberService mqtt) { this.database = database; this.mqtt = mqtt; }
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        try {
            database.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok(Map.of("status", "UP", "database", "UP", "mqtt", !mqtt.isEnabled() ? "DISABLED" : mqtt.isConnected() ? "CONNECTED" : "DISCONNECTED"));
        } catch (Exception e) { return ResponseEntity.status(503).body(Map.of("status", "DOWN", "database", "DOWN")); }
    }
}
