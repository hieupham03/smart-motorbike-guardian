package com.guardian;

import com.fasterxml.jackson.databind.JsonNode;
import com.guardian.config.JwtTokenProvider;
import com.guardian.dto.*;
import com.guardian.entity.*;
import com.guardian.repository.*;
import com.guardian.service.*;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "app.mqtt.enabled=false", "app.seed.enabled=false", "app.jwt.secret=integration-test-signing-key-at-least-32-bytes",
    "app.realtime.command-timeout-seconds=3600", "app.realtime.offline-timeout-seconds=3600"
})
@ActiveProfiles("h2")
class RealtimeIntegrationTest {
    @LocalServerPort int port;
    @Autowired MqttSubscriberService mqtt;
    @Autowired TelemetryService telemetry;
    @Autowired CommandService commandService;
    @Autowired DevicePresenceService presence;
    @Autowired AlertService alertService;
    @Autowired AuthService auth;
    @Autowired DeviceRepository devices;
    @Autowired UserRepository users;
    @Autowired OwnershipRepository ownerships;
    @Autowired CommandRepository commands;
    @Autowired AlertRepository alerts;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtTokenProvider tokens;
    @Autowired TestRestTemplate rest;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactions;
    Device device;
    User owner, viewer, stranger;
    final String password = "test-password-only";

    @BeforeEach void fixtures() {
        owner = users.save(new User(UUID.randomUUID().toString(), UUID.randomUUID()+"@test.invalid", passwords.encode(password), "Owner", Role.OWNER, "ACTIVE"));
        viewer = users.save(new User(UUID.randomUUID().toString(), UUID.randomUUID()+"@test.invalid", passwords.encode(password), "Viewer", Role.OWNER, "ACTIVE"));
        stranger = users.save(new User(UUID.randomUUID().toString(), UUID.randomUUID()+"@test.invalid", passwords.encode(password), "Other", Role.OWNER, "ACTIVE"));
        device = devices.save(new Device(UUID.randomUUID().toString(), UUID.randomUUID().toString(), "Test hardware", null, null));
        ownerships.save(new Ownership(UUID.randomUUID().toString(), owner, device, Role.OWNER));
        ownerships.save(new Ownership(UUID.randomUUID().toString(), viewer, device, Role.VIEWER));
    }
    void message(String suffix, String json) {
        mqtt.messageArrived("guardian/"+device.getDeviceUuid()+"/"+suffix, new MqttMessage(json.getBytes(StandardCharsets.UTF_8)));
    }
    String payload(boolean valid) {
        return "{\"data_source\":\"HARDWARE\",\"sensor_connected\":true,\"imu_valid\":true,\"speed_valid\":true,\"gps_valid\":"+valid+",\"gps_age_ms\":0,\"latitude\":0,\"longitude\":0,\"speed_kmh\":3,\"accel_x\":0,\"accel_y\":0,\"accel_z\":9.81,\"state\":\"ALARM\",\"ts\":123}";
    }

    @Test void mqttPreservesValidityNullBatteryUptimeStateAndLastFix() {
        message("telemetry", payload(true));
        var latest = telemetry.getLatest(device.getDeviceId(), owner);
        assertThat(latest.getBatteryV()).isNull(); assertThat(latest.getDeviceUptimeS()).isEqualTo(123);
        assertThat(latest.getReceivedAt()).isAfter(Instant.now().minusSeconds(5));
        assertThat(latest.getTs()).isGreaterThan(1_000_000_000L); assertThat(latest.getLatitude()).isZero();
        assertThat(devices.findById(device.getDeviceId()).orElseThrow().getSecurityState()).isEqualTo(SecurityState.ALARM);
        message("telemetry", "{\"sensor_connected\":false,\"gps_valid\":false,\"speed_valid\":false,\"imu_valid\":false,\"gps_age_ms\":4294967295}");
        latest = telemetry.getLatest(device.getDeviceId(), owner);
        assertThat(latest.getLatitude()).isNull(); assertThat(latest.getSpeedKmh()).isNull(); assertThat(latest.getAccelZ()).isNull();
        var saved = devices.findById(device.getDeviceId()).orElseThrow();
        assertThat(saved.getLastLatitude()).isZero(); assertThat(saved.getLastLocationReceivedAt()).isNotNull(); assertThat(saved.getGpsValid()).isFalse();
        assertThat(telemetry.getTelemetryHistory(device.getDeviceId(), 0L, 100L, owner)).isEmpty();
    }

    @Test void invalidCoordinatesAndSpoofedDeviceAreNotAccepted() {
        message("telemetry", payload(true).replace("\"latitude\":0", "\"latitude\":91"));
        assertThat(telemetry.getLatest(device.getDeviceId(), owner).getGpsValid()).isFalse();
        message("telemetry", "{\"device_id\":\"someone-else\",\"speed_kmh\":100}");
        assertThat(telemetry.getLatest(device.getDeviceId(), owner).getSpeedKmh()).isEqualTo(3);
    }

    @Test void offlineLwtInvalidatesSensorsAndTelemetryRecoversGateway() {
        message("telemetry", payload(false)); message("status", "{\"status\":\"offline\"}");
        var saved = devices.findById(device.getDeviceId()).orElseThrow();
        assertThat(saved.getLifecycleState()).isEqualTo(LifecycleState.OFFLINE); assertThat(saved.getSensorConnected()).isFalse();
        message("telemetry", payload(false));
        assertThat(devices.findById(device.getDeviceId()).orElseThrow().getLifecycleState()).isEqualTo(LifecycleState.ACTIVE);
    }

    Command pending() { return commands.save(new Command(UUID.randomUUID().toString(), device, owner, CommandType.ARM, null)); }
    @Test void ackMustMatchDeviceAndTerminalStatusIsStable() {
        Command command = pending();
        commandService.processCommandAck(stranger.getUserId(), command.getCmdId(), "EXECUTED", null);
        assertThat(commands.findById(command.getCmdId()).orElseThrow().getStatus()).isEqualTo(CommandStatus.PENDING);
        message("cmd/ack", "{\"cmd_id\":\""+command.getCmdId()+"\",\"result\":\"REJECTED\",\"reason_if_failed\":\"SENSOR_STALE\"}");
        commandService.processCommandAck(device.getDeviceUuid(), command.getCmdId(), "EXECUTED", null);
        assertThat(commands.findById(command.getCmdId()).orElseThrow().getStatus()).isEqualTo(CommandStatus.REJECTED);
    }
    @Test void timeoutStoresLateAckWithoutChangingFinalStatus() {
        Command command = new Command(UUID.randomUUID().toString(), device, owner, CommandType.ARM, null);
        command.setIssuedAt(Instant.now().minusSeconds(30)); commands.save(command);
        commandService.timeout(command.getCmdId(), Instant.now().minusSeconds(10));
        commandService.processCommandAck(device.getDeviceUuid(), command.getCmdId(), "EXECUTED", null);
        var saved = commands.findById(command.getCmdId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(CommandStatus.TIMEOUT); assertThat(saved.getLateAckResult()).isEqualTo("EXECUTED");
    }
    @Test void mqttUnavailableDoesNotSimulateExecution() {
        var response = commandService.sendCommand(device.getDeviceId(), new CommandRequest(CommandType.ARM, null, null), owner, "test");
        assertThat(response.getStatus()).isEqualTo(CommandStatus.PENDING);
        var saved = commands.findById(response.getCmdId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(CommandStatus.REJECTED); assertThat(saved.getReasonIfFailed()).isEqualTo("MQTT_UNAVAILABLE");
        assertThat(saved.getAckAt()).isNull(); assertThat(devices.findById(device.getDeviceId()).orElseThrow().getSecurityState()).isEqualTo(SecurityState.PARKED);
    }
    @Test void duplicateAlertIsScopedToDeviceAndDetailsPreserved() {
        message("alert", "{\"alert_id\":\"shared-id\",\"reason\":\"FALL_DETECTED\",\"severity\":\"HIGH\",\"details\":{\"tilt_deg\":60},\"ts\":7}");
        message("alert", "{\"alert_id\":\"shared-id\",\"reason\":\"FALL_DETECTED\"}");
        var list = alertService.getAlerts(device.getDeviceId(), null, owner);
        assertThat(list).hasSize(1); assertThat(list.get(0).getDetails()).contains("tilt_deg"); assertThat(list.get(0).getDeviceUptimeS()).isEqualTo(7);
        var other = devices.save(new Device(UUID.randomUUID().toString(), UUID.randomUUID().toString(), "Other", null, null));
        var dto = new AlertDto(); dto.setAlertId("shared-id");
        assertThat(alertService.processAlert(other.getDeviceUuid(), dto)).isNotNull();
    }

    HttpHeaders bearer(User user) { var h = new HttpHeaders(); h.setBearerAuth(tokens.generateAccessToken(user)); return h; }
    @Test void restBlocksViewerMutationStrangerReadAndRefreshAsAccess() {
        String path = "/api/devices/"+device.getDeviceId();
        assertThat(rest.exchange(path+"/command", HttpMethod.POST, new HttpEntity<>(new CommandRequest(CommandType.ARM,null,null), bearer(viewer)), String.class).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(rest.exchange(path+"/telemetry", HttpMethod.GET, new HttpEntity<>(bearer(stranger)), String.class).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(rest.exchange(path+"/telemetry", HttpMethod.POST, new HttpEntity<>(new TelemetryDto(), bearer(viewer)), String.class).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(rest.exchange("/api/simulator/action", HttpMethod.POST, new HttpEntity<>(java.util.Map.of("deviceId",device.getDeviceId(),"action","SET_SPEED","value",1), bearer(viewer)), String.class).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        var refreshHeaders = new HttpHeaders(); refreshHeaders.setBearerAuth(tokens.generateRefreshToken(owner));
        assertThat(rest.exchange(path, HttpMethod.GET, new HttpEntity<>(refreshHeaders), String.class).getStatusCode().is4xxClientError()).isTrue();
        assertThatThrownBy(() -> auth.refreshToken(tokens.generateAccessToken(owner))).isInstanceOf(com.guardian.exception.UnauthorizedException.class);
    }
    @Test void registrationCannotChooseAdminAndSimulationCannotOverwriteHardware() {
        var request = new RegisterRequest(); request.setEmail("admin-"+UUID.randomUUID()+"@test.invalid"); request.setPassword(password); request.setFullName("Test"); request.setRole(Role.ADMIN);
        assertThatThrownBy(() -> auth.register(request, "test")).isInstanceOf(com.guardian.exception.BadRequestException.class);
        var dto = new TelemetryDto(); dto.setDataSource("SIMULATED"); dto.setSpeedKmh(100.0);
        assertThat(telemetry.recordTelemetry(device.getDeviceId(), dto)).isNull();
    }

    @Test void rollbackDoesNotPersistOrBroadcastTelemetry() {
        var template = new org.springframework.transaction.support.TransactionTemplate(transactions);
        assertThatThrownBy(() -> template.execute(status -> {
            var dto = new TelemetryDto(); dto.setSensorConnected(false);
            telemetry.recordTelemetry(device.getDeviceId(), dto);
            throw new IllegalStateException("rollback-test");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(telemetry.getLatest(device.getDeviceId(), owner)).isNull();
    }

    @Test void websocketRejectsRefreshTokenAndPublicSubscriptions() throws Exception {
        var stomp = new WebSocketStompClient(new StandardWebSocketClient());
        stomp.setMessageConverter(new MappingJackson2MessageConverter());
        try {
            StompHeaders refresh = new StompHeaders(); refresh.set("Authorization", "Bearer "+tokens.generateRefreshToken(owner));
            assertThatThrownBy(() -> stomp.connectAsync("ws://localhost:"+port+"/ws", new org.springframework.web.socket.WebSocketHttpHeaders(), refresh, new StompSessionHandlerAdapter() {}).get(3, TimeUnit.SECONDS)).isInstanceOf(ExecutionException.class);
            CountDownLatch rejected = new CountDownLatch(1);
            StompHeaders access = new StompHeaders(); access.set("Authorization", "Bearer "+tokens.generateAccessToken(owner));
            var session = stomp.connectAsync("ws://localhost:"+port+"/ws", new org.springframework.web.socket.WebSocketHttpHeaders(), access, new StompSessionHandlerAdapter() {
                @Override public void handleFrame(StompHeaders h, Object payload) { rejected.countDown(); }
            }).get(3,TimeUnit.SECONDS);
            session.subscribe("/topic/alerts", new StompFrameHandler() {
                @Override public Type getPayloadType(StompHeaders h) { return JsonNode.class; }
                @Override public void handleFrame(StompHeaders h, Object p) {}
            });
            assertThat(rejected.await(3,TimeUnit.SECONDS)).isTrue();
            // The server closes the transport after rejecting SUBSCRIBE; stomp.stop handles cleanup.
        } finally { stomp.stop(); }
    }

    @Test void viewerReceivesOwnRoleAndRevocationStopsStream() throws Exception {
        var stomp = new WebSocketStompClient(new StandardWebSocketClient()); stomp.setMessageConverter(new MappingJackson2MessageConverter());
        StompHeaders headers = new StompHeaders(); headers.set("Authorization", "Bearer "+tokens.generateAccessToken(viewer));
        var session = stomp.connectAsync("ws://localhost:"+port+"/ws", new org.springframework.web.socket.WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {}).get(3,TimeUnit.SECONDS);
        BlockingQueue<JsonNode> received = new LinkedBlockingQueue<>();
        session.subscribe("/user/queue/events", new StompFrameHandler() {
            @Override public Type getPayloadType(StompHeaders h) { return JsonNode.class; }
            @Override public void handleFrame(StompHeaders h, Object p) { received.add((JsonNode)p); }
        });
        try {
            Thread.sleep(150); message("telemetry",payload(false));
            assertThat(received.poll(3,TimeUnit.SECONDS).path("type").asText()).isEqualTo("TELEMETRY");
            assertThat(received.poll(3,TimeUnit.SECONDS).path("data").path("currentUserRole").asText()).isEqualTo("VIEWER");
            new org.springframework.transaction.support.TransactionTemplate(transactions).execute(status -> { ownerships.deleteByUserAndDevice(viewer,device); return null; });
            received.clear(); message("telemetry",payload(false));
            assertThat(received.poll(300,TimeUnit.MILLISECONDS)).isNull();
        } finally { session.disconnect(); stomp.stop(); }
    }

    @Test void mqttToDatabaseToAuthenticatedWebsocketDeliversWithoutPolling() throws Exception {
        var stomp = new WebSocketStompClient(new StandardWebSocketClient()); stomp.setMessageConverter(new MappingJackson2MessageConverter());
        StompHeaders headers = new StompHeaders(); headers.set("Authorization", "Bearer "+tokens.generateAccessToken(owner));
        var session = stomp.connectAsync("ws://localhost:"+port+"/ws", new org.springframework.web.socket.WebSocketHttpHeaders(), headers, new StompSessionHandlerAdapter() {}).get(5, TimeUnit.SECONDS);
        BlockingQueue<JsonNode> received = new LinkedBlockingQueue<>();
        session.subscribe("/user/queue/events", new StompFrameHandler() {
            @Override public Type getPayloadType(StompHeaders h) { return JsonNode.class; }
            @Override public void handleFrame(StompHeaders h, Object p) { received.add((JsonNode)p); }
        });
        try {
            // Wait for async SUBSCRIBE handling, then inject firmware-shaped MQTT input.
            Thread.sleep(150);
            try (var broker = new TestMqttBroker()) {
                var client = new MqttSubscriberService();
                org.springframework.test.util.ReflectionTestUtils.setField(client,"mqttEnabled",true);
                org.springframework.test.util.ReflectionTestUtils.setField(client,"brokerUrl","tcp://127.0.0.1:"+broker.port());
                org.springframework.test.util.ReflectionTestUtils.setField(client,"clientId","integration-client");
                org.springframework.test.util.ReflectionTestUtils.setField(client,"username","");
                org.springframework.test.util.ReflectionTestUtils.setField(client,"telemetryService",telemetry);
                org.springframework.test.util.ReflectionTestUtils.setField(client,"alertService",alertService);
                org.springframework.test.util.ReflectionTestUtils.setField(client,"commandService",commandService);
                org.springframework.test.util.ReflectionTestUtils.setField(client,"presenceService",presence);
                try {
                    client.init(); broker.awaitSubscriptions();
                    long started = System.nanoTime(); broker.publish("guardian/"+device.getDeviceUuid()+"/telemetry",payload(true));
                    var event = received.poll(3, TimeUnit.SECONDS);
                    assertThat(event).isNotNull(); assertThat(event.path("type").asText()).isEqualTo("TELEMETRY");
                    assertThat(event.path("deviceId").asText()).isEqualTo(device.getDeviceId());
                    assertThat(event.path("data").path("batteryV").isNull()).isTrue();
                    assertThat(telemetry.getLatest(device.getDeviceId(), owner).getReadingId()).isEqualTo(event.path("data").path("readingId").asText());
                    System.out.println("LOCAL_SOFTWARE_MQTT_TCP_TO_WS_MS="+TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-started));
                    assertThat(received.poll(3,TimeUnit.SECONDS).path("type").asText()).isEqualTo("DEVICE");
                } finally { client.cleanup(); }
            }
            received.clear();
            var other = devices.save(new Device(UUID.randomUUID().toString(), UUID.randomUUID().toString(), "Unauthorized", null, null));
            var dto = new TelemetryDto(); dto.setSensorConnected(false);
            telemetry.recordTelemetry(other.getDeviceUuid(), dto);
            assertThat(received.poll(300, TimeUnit.MILLISECONDS)).isNull();
        } finally { session.disconnect(); stomp.stop(); }
    }
}
