package com.guardian.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guardian.dto.AlertDto;
import com.guardian.dto.TelemetryDto;
import com.guardian.entity.AlertSeverity;
import com.guardian.entity.LifecycleState;
import com.guardian.entity.SecurityState;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;

@Service
public class MqttSubscriberService implements MqttCallbackExtended {

    private static final Logger log = LoggerFactory.getLogger(MqttSubscriberService.class);

    @Value("${app.mqtt.enabled:true}")
    private boolean mqttEnabled;

    @Value("${app.mqtt.broker-url:tcp://localhost:1883}")
    private String brokerUrl;

    @Value("${app.mqtt.client-id:guardian-backend-service}")
    private String clientId;

    @Value("${app.mqtt.username:}")
    private String username;

    @Value("${app.mqtt.password:}")
    private String password;

    private MqttClient mqttClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    @Lazy
    private TelemetryService telemetryService;

    @Autowired
    @Lazy
    private AlertService alertService;

    @Autowired
    @Lazy
    private CommandService commandService;

    @Autowired
    private DevicePresenceService presenceService;

    @PostConstruct
    public void init() {
        if (!mqttEnabled) {
            log.info("MQTT Integration is disabled via config.");
            return;
        }

        connectToBroker();
    }

    public synchronized void connectToBroker() {
        if (mqttClient != null && mqttClient.isConnected()) return;
        try {
            if (mqttClient != null) mqttClient.close(true);
            mqttClient = new MqttClient(brokerUrl, clientId + "-" + System.currentTimeMillis(), new MemoryPersistence());
            mqttClient.setTimeToWait(3000);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(false); // One scheduled retry loop owns connection attempts.
            options.setConnectionTimeout(3);
            options.setKeepAliveInterval(30);
            if (username != null && !username.isBlank()) {
                options.setUserName(username);
                options.setPassword(password.toCharArray());
            }

            mqttClient.setCallback(this);
            log.info("Attempting connection to MQTT Broker at {}", brokerUrl);
            mqttClient.connect(options);
            log.info("Successfully connected to MQTT Broker!");
        } catch (Exception e) {
            log.warn("Could not connect to MQTT Broker ({}): {}. Hardware commands remain unavailable until reconnect.", brokerUrl, e.getMessage());
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 5000)
    public void reconnectIfNeeded() {
        if (mqttEnabled && (mqttClient == null || !mqttClient.isConnected())) connectToBroker();
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        log.info("MQTT connection established (reconnect={}). Subscribing to topics...", reconnect);
        try {
            mqttClient.subscribe("guardian/+/telemetry", 0);
            mqttClient.subscribe("guardian/+/event", 1);
            mqttClient.subscribe("guardian/+/alert", 1);
            mqttClient.subscribe("guardian/+/heartbeat", 0);
            mqttClient.subscribe("guardian/+/status", 1);
            mqttClient.subscribe("guardian/+/cmd/ack", 1);
            log.info("Subscribed to guardian/+/+ MQTT topics successfully.");
        } catch (MqttException e) {
            log.error("Failed to subscribe to MQTT topics: {}", e.getMessage());
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("MQTT Connection lost: {}", cause != null ? cause.getMessage() : "Unknown");
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
        log.debug("MQTT message arrived on [{}]: {}", topic, payload);

        try {
            String[] parts = topic.split("/");
            if (parts.length < 3) return;

            String deviceId = parts[1];
            String type = parts[2];

            if (!"guardian".equals(parts[0])) return;
            JsonNode node = objectMapper.readTree(payload);
            if (node.has("device_id") && !deviceId.equals(node.path("device_id").asText())) return;

            switch (type) {
                case "telemetry":
                    handleTelemetry(deviceId, node);
                    break;
                case "alert":
                    handleAlert(deviceId, node);
                    break;
                case "cmd":
                    if (parts.length >= 4 && "ack".equals(parts[3])) {
                        handleCommandAck(deviceId, node);
                    }
                    break;
                case "heartbeat":
                case "status":
                    handleStatus(deviceId, node);
                    break;
                default:
                    log.debug("Unhandled MQTT topic: {}", topic);
            }
        } catch (Exception e) {
            log.error("Error processing MQTT message: {}", e.getMessage());
        }
    }

    private void handleTelemetry(String deviceId, JsonNode node) {
        TelemetryDto dto = new TelemetryDto();
        dto.setDeviceId(deviceId);
        dto.setDataSource("HARDWARE");
        dto.setSensorConnected(node.path("sensor_connected").asBoolean(false));
        dto.setImuValid(node.path("imu_valid").asBoolean(false));
        dto.setSpeedValid(node.path("speed_valid").asBoolean(false));
        dto.setGpsValid(node.path("gps_valid").asBoolean(false));
        if (node.path("gps_age_ms").isIntegralNumber()) dto.setGpsAgeMs(node.path("gps_age_ms").asLong());
        dto.setSpeedKmh(number(node, "speed_kmh")); dto.setBatteryV(number(node, "battery_v"));
        dto.setAccelX(number(node, "accel_x")); dto.setAccelY(number(node, "accel_y")); dto.setAccelZ(number(node, "accel_z"));
        dto.setLatitude(number(node, "latitude")); dto.setLongitude(number(node, "longitude"));
        if (node.has("state")) dto.setState(node.path("state").asText());
        if (node.path("ts").isIntegralNumber()) dto.setDeviceUptimeS(node.path("ts").asLong());

        telemetryService.recordTelemetry(deviceId, dto);
    }

    private Double number(JsonNode node, String field) {
        return node.path(field).isNumber() ? TelemetryService.finite(node.path(field).doubleValue()) : null;
    }

    private void handleAlert(String deviceId, JsonNode node) {
        AlertDto dto = new AlertDto();
        dto.setDataSource("HARDWARE");
        if (node.path("ts").isIntegralNumber()) dto.setDeviceUptimeS(node.path("ts").asLong());
        dto.setDeviceId(deviceId);
        if (node.has("alert_id")) dto.setAlertId(node.get("alert_id").asText());
        
        if (node.has("reason")) {
            String r = node.get("reason").asText();
            if ("IMPACT_OR_THEFT".equalsIgnoreCase(r)) {
                r = "MOTION_WHILE_ARMED";
            }
            dto.setReason(r);
        }

        if (node.has("severity")) {
            try {
                dto.setSeverity(AlertSeverity.valueOf(node.get("severity").asText().toUpperCase()));
            } catch (Exception ignored) {}
        }
        if (node.has("action_taken")) dto.setActionTaken(node.get("action_taken").asText());
        if (node.has("details")) dto.setDetails(node.get("details").isTextual() ? node.get("details").asText() : node.get("details").toString());

        alertService.processAlert(deviceId, dto);
    }

    private void handleCommandAck(String deviceId, JsonNode node) {
        if (!node.has("cmd_id") || !node.has("result")) return;

        String cmdId = node.get("cmd_id").asText();
        String result = node.get("result").asText();
        String reasonIfFailed = node.has("reason_if_failed") && !node.get("reason_if_failed").isNull()
                ? node.get("reason_if_failed").asText() : null;

        commandService.processCommandAck(deviceId, cmdId, result, reasonIfFailed);
    }

    private void handleStatus(String deviceId, JsonNode node) {
        String status = node.isTextual() ? node.asText() : node.path("status").asText();
        if ("online".equalsIgnoreCase(status) || "offline".equalsIgnoreCase(status))
            presenceService.status(deviceId, "online".equalsIgnoreCase(status), node.has("fw") ? node.path("fw").asText() : null);
    }

    public boolean publishCommand(String deviceId, String cmdType, String jsonPayload) {
        if (mqttClient == null || !mqttClient.isConnected()) {
            return false;
        }

        try {
            String topic = "guardian/" + deviceId + "/cmd/" + cmdType.toLowerCase();
            MqttMessage msg = new MqttMessage(jsonPayload.getBytes(StandardCharsets.UTF_8));
            msg.setQos(1);
            msg.setRetained(false);
            mqttClient.publish(topic, msg);
            log.info("Published command to [{}] with payload: {}", topic, jsonPayload);
            return true;
        } catch (Exception e) {
            log.error("Failed to publish MQTT command: {}", e.getMessage());
            return false;
        }
    }

    public boolean isConnected() { return mqttClient != null && mqttClient.isConnected(); }
    public boolean isEnabled() { return mqttEnabled; }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {}

    @PreDestroy
    public void cleanup() {
        if (mqttClient != null) {
            try {
                if (mqttClient.isConnected()) mqttClient.disconnect();
                mqttClient.close();
            } catch (Exception ignored) {}
        }
    }
}
