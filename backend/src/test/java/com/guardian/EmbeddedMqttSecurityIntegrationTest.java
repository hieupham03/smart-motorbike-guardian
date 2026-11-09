package com.guardian;

import com.guardian.config.JwtTokenProvider;
import com.guardian.dto.*;
import com.guardian.entity.*;
import com.guardian.repository.*;
import com.guardian.service.*;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.awaitility.Awaitility.await;

/** Real localhost MQTT clients exercise the production broker, database ACL and revocation. No board is simulated as hardware evidence. */
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("h2") @DirtiesContext
class EmbeddedMqttSecurityIntegrationTest {
    static final String SERVICE_SECRET=UUID.randomUUID()+"-"+UUID.randomUUID();
    static final String JWT_SECRET=UUID.randomUUID()+"-"+UUID.randomUUID();
    static final String BOOTSTRAP_SECRET=UUID.randomUUID().toString();
    static final int PORT=freePort();
    static int freePort() {try(ServerSocket s=new ServerSocket(0)) {return s.getLocalPort();}catch(Exception e){throw new IllegalStateException(e);}}
    @DynamicPropertySource static void properties(DynamicPropertyRegistry p) {
        p.add("app.mqtt.embedded.enabled",()->true);p.add("app.mqtt.embedded.host",()->"127.0.0.1");p.add("app.mqtt.embedded.port",()->PORT);
        p.add("app.mqtt.enabled",()->true);p.add("app.mqtt.broker-url",()->"tcp://127.0.0.1:"+PORT);
        p.add("app.mqtt.username",()->"backend-service");p.add("app.mqtt.password",()->SERVICE_SECRET);p.add("app.jwt.secret",()->JWT_SECRET);
        p.add("app.seed.enabled",()->true);p.add("app.seed.password",()->BOOTSTRAP_SECRET);
        p.add("app.seed.hardware-unclaimed",()->true);p.add("app.mqtt.demo-device-password",()->BOOTSTRAP_SECRET);p.add("app.push.enabled",()->false);
        p.add("spring.datasource.url",()->"jdbc:h2:mem:embedded_security;DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
    }
    @Autowired DeviceRepository devices; @Autowired UserRepository users; @Autowired OwnershipRepository ownerships;
    @Autowired TelemetryRepository readings; @Autowired DeviceService lifecycle; @Autowired DeviceCredentialService credentials;
    @Autowired PasswordEncoder passwords; @Autowired JwtTokenProvider tokens; @Autowired TestRestTemplate rest;
    Device device; User owner,viewer,admin; String secret; final List<MqttClient> clients=new ArrayList<>();
    @BeforeEach void fixtures() {
        secret=UUID.randomUUID().toString();
        owner=users.save(new User(UUID.randomUUID().toString(),UUID.randomUUID()+"@test.invalid",passwords.encode(secret),"Owner",Role.OWNER,"ACTIVE"));
        viewer=users.save(new User(UUID.randomUUID().toString(),UUID.randomUUID()+"@test.invalid",passwords.encode(secret),"Viewer",Role.VIEWER,"ACTIVE"));
        admin=users.save(new User(UUID.randomUUID().toString(),UUID.randomUUID()+"@test.invalid",passwords.encode(secret),"Admin",Role.ADMIN,"ACTIVE"));
        device=new Device(UUID.randomUUID().toString(),UUID.randomUUID().toString(),"MQTT security test",null,null);
        device.setLifecycleState(LifecycleState.ACTIVE);device.setMqttUsername("device-"+device.getDeviceUuid());device.setMqttPasswordHash(passwords.encode(secret));
        device=devices.save(device);ownerships.save(new Ownership(UUID.randomUUID().toString(),owner,device,Role.OWNER));
        ownerships.save(new Ownership(UUID.randomUUID().toString(),viewer,device,Role.VIEWER));
    }
    @AfterEach void closeClients() {for(MqttClient client:clients)try {if(client.isConnected())client.disconnect();client.close(true);}catch(Exception ignored){}}
    MqttClient client(String id) throws Exception {MqttClient c=new MqttClient("tcp://127.0.0.1:"+PORT,id,new MemoryPersistence());c.setTimeToWait(3000);clients.add(c);return c;}
    MqttConnectOptions options(String user,String password) {var o=new MqttConnectOptions();o.setMqttVersion(MqttConnectOptions.MQTT_VERSION_3_1_1);o.setCleanSession(true);o.setConnectionTimeout(2);o.setKeepAliveInterval(3);if(user!=null){o.setUserName(user);o.setPassword(password.toCharArray());}return o;}
    MqttClient connectDevice() throws Exception {var c=client("Guardian-"+device.getDeviceUuid());c.connect(options(device.getMqttUsername(),secret));return c;}
    String telemetry(Device d) {return "{\"device_id\":\""+d.getDeviceUuid()+"\",\"speed_kmh\":3,\"speed_valid\":true,\"sensor_connected\":true,\"imu_valid\":false,\"gps_valid\":false,\"ts\":1}";}
    void publish(MqttClient c,Device d) throws Exception {c.publish("guardian/"+d.getDeviceUuid()+"/telemetry",telemetry(d).getBytes(StandardCharsets.UTF_8),1,false);}
    HttpHeaders bearer(User u) {var h=new HttpHeaders();h.setBearerAuth(tokens.generateAccessToken(u));return h;}

    @Test void anonymousWrongPasswordAndWrongDeviceIdentityCannotConnect() throws Exception {
        var anonymous=client("anonymous-test");assertThatThrownBy(()->anonymous.connect(options(null,null))).isInstanceOf(MqttException.class);
        var wrong=client("Guardian-"+device.getDeviceUuid());assertThatThrownBy(()->wrong.connect(options(device.getMqttUsername(),"incorrect"))).isInstanceOf(MqttException.class);
        var spoof=client("Guardian-"+UUID.randomUUID());assertThatThrownBy(()->spoof.connect(options(device.getMqttUsername(),secret))).isInstanceOf(MqttException.class);
    }
    @Test void authenticatedDeviceReachesDatabaseButCannotPublishOrSubscribeOutsideItsTopics() throws Exception {
        MqttClient c=connectDevice();c.subscribe("guardian/"+device.getDeviceUuid()+"/cmd/#",1);
        assertThatThrownBy(()->c.subscribe("guardian/+/telemetry",1)).isInstanceOf(MqttException.class);
        publish(c,device);await().atMost(5,TimeUnit.SECONDS).untilAsserted(()->assertThat(readings.findTop50ByDeviceOrderByTsDesc(device)).hasSize(1));
        Device other=new Device(UUID.randomUUID().toString(),UUID.randomUUID().toString(),"Other hardware",null,null);other.setLifecycleState(LifecycleState.ACTIVE);other=devices.save(other);
        try {publish(c,other);}catch(MqttException denied) { /* MQTT 3.1.1 may close the connection for a denied publication. */ }
        Device foreign=other;
        await().during(400,TimeUnit.MILLISECONDS).atMost(2,TimeUnit.SECONDS).untilAsserted(()->assertThat(readings.findTop50ByDeviceOrderByTsDesc(foreign)).isEmpty());
    }
    @Test void revokeDisconnectsActiveDeviceAndRejectsReconnectAndLateTelemetry() throws Exception {
        MqttClient c=connectDevice();publish(c,device);
        await().atMost(5,TimeUnit.SECONDS).untilAsserted(()->assertThat(readings.findTop50ByDeviceOrderByTsDesc(device)).hasSize(1));
        lifecycle.revokeDevice(device.getDeviceId(),owner,"TEST");
        await().atMost(4,TimeUnit.SECONDS).until(()->!c.isConnected());
        assertThat(devices.findById(device.getDeviceId()).orElseThrow().getMqttPasswordHash()).isNull();
        assertThatThrownBy(()->c.connect(options(device.getMqttUsername(),secret))).isInstanceOf(MqttException.class);
        assertThat(readings.findTop50ByDeviceOrderByTsDesc(device)).hasSize(1);
    }
    @Test void decommissionAlsoDisconnectsAndCannotBeRestoredByCredentialRotation() throws Exception {
        MqttClient c=connectDevice();lifecycle.decommissionDevice(device.getDeviceId(),owner,"TEST");
        await().atMost(4,TimeUnit.SECONDS).until(()->!c.isConnected());
        assertThatThrownBy(()->c.connect(options(device.getMqttUsername(),secret))).isInstanceOf(MqttException.class);
        assertThatThrownBy(()->credentials.rotate(device.getDeviceId(),owner,"TEST","localhost")).isInstanceOf(com.guardian.exception.BadRequestException.class);
    }
    @Test void credentialRotationIsOwnerOnlyReturnsNoStoreAndInvalidatesOldSecret() throws Exception {
        String path="/api/devices/"+device.getDeviceId()+"/mqtt-credentials";
        assertThat(rest.exchange(path,HttpMethod.POST,new HttpEntity<>(bearer(viewer)),String.class).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        MqttClient c=connectDevice();
        var result=rest.exchange(path,HttpMethod.POST,new HttpEntity<>(bearer(owner)),com.fasterxml.jackson.databind.JsonNode.class);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);assertThat(result.getHeaders().getCacheControl()).isEqualTo("no-store");
        var data=result.getBody().path("data");String rotated=data.path("password").asText();assertThat(rotated).hasSizeGreaterThanOrEqualTo(32);
        assertThat(data.path("username").asText()).isEqualTo(device.getMqttUsername());
        await().atMost(4,TimeUnit.SECONDS).until(()->!c.isConnected());
        assertThatThrownBy(()->c.connect(options(device.getMqttUsername(),secret))).isInstanceOf(MqttException.class);
        c.connect(options(device.getMqttUsername(),rotated));assertThat(c.isConnected()).isTrue();
    }
    @Test void provisioningUsesExpiringClaimAndProtectedPasswordChangeRejectsAnonymous() throws Exception {
        var registered=lifecycle.registerDevice(new DeviceRegistrationRequest("New physical node",null,"ESP32-S3","test-build","HARDWARE"),admin,"TEST");
        Device pending=devices.findById(registered.getDeviceId()).orElseThrow();
        assertThat(pending.getClaimToken()).isNotBlank();assertThat(pending.getClaimTokenExpiry()).isAfter(Instant.now());
        pending.setClaimTokenExpiry(Instant.now().minusSeconds(1));devices.save(pending);
        assertThatThrownBy(()->lifecycle.onboardDevice(new OnboardRequest(pending.getClaimToken(),"Claimed",null,null),owner,"TEST")).isInstanceOf(com.guardian.exception.BadRequestException.class);
        var request=java.net.http.HttpRequest.newBuilder(java.net.URI.create(rest.getRootUri()+"/api/auth/change-password"))
            .header("Content-Type","application/json").POST(java.net.http.HttpRequest.BodyPublishers.ofString("{}")).build();
        var response=java.net.http.HttpClient.newHttpClient().send(request,java.net.http.HttpResponse.BodyHandlers.discarding());
        assertThat(response.statusCode()).isEqualTo(401);
    }
    @Test void newlyProvisionedPhysicalIdentityCannotConnectUntilClaimedAndClaimIsOneUse() throws Exception {
        var registered=lifecycle.registerDevice(new DeviceRegistrationRequest("Onboarding test",null,null,null,"HARDWARE"),admin,"TEST");
        Device pending=devices.findById(registered.getDeviceId()).orElseThrow();String claim=pending.getClaimToken();
        var access=credentials.rotate(pending.getDeviceId(),admin,"TEST","localhost");
        var c=client("Guardian-"+pending.getDeviceUuid());
        assertThatThrownBy(()->c.connect(options(access.username(),access.password()))).isInstanceOf(MqttException.class);
        var response=rest.exchange("/api/devices/onboard",HttpMethod.POST,new HttpEntity<>(new OnboardRequest(claim,"Activated test",null,null),bearer(owner)),String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        c.connect(options(access.username(),access.password()));publish(c,pending);
        await().atMost(5,TimeUnit.SECONDS).untilAsserted(()->assertThat(readings.findTop50ByDeviceOrderByTsDesc(pending)).hasSize(1));
        assertThatThrownBy(()->lifecycle.onboardDevice(new OnboardRequest(claim,"Replay",null,null),owner,"TEST")).isInstanceOf(com.guardian.exception.BadRequestException.class);
    }
    @Test void classroomBootstrapLeavesPhysicalNodeUnclaimedAndNeverRestoresRevokedCredentials() throws Exception {
        Device seeded=devices.findByDeviceUuid("550e8400-e29b-41d4-a716-446655440001").orElseThrow();
        assertThat(seeded.getLifecycleState()).isEqualTo(LifecycleState.PROVISIONED);
        assertThat(ownerships.findByDevice(seeded)).isEmpty();assertThat(seeded.getClaimTokenExpiry()).isAfter(Instant.now());
        assertThat(passwords.matches(BOOTSTRAP_SECRET,seeded.getMqttPasswordHash())).isTrue();
        lifecycle.onboardDevice(new OnboardRequest(seeded.getClaimToken(),"Classroom physical node",null,null),owner,"TEST");
        lifecycle.revokeDevice(seeded.getDeviceId(),owner,"TEST");
        new com.guardian.config.DemoDeviceCredentialInitializer(devices,passwords,BOOTSTRAP_SECRET)
            .run(new org.springframework.boot.DefaultApplicationArguments(new String[0]));
        assertThat(devices.findById(seeded.getDeviceId()).orElseThrow().getMqttPasswordHash()).isNull();
    }
    @Test void reactivationIsExplicitOwnerOnlyAndIssuesNewCredentialWithoutRestoringOldAccess() throws Exception {
        MqttClient c=connectDevice();lifecycle.revokeDevice(device.getDeviceId(),owner,"TEST");
        await().atMost(4,TimeUnit.SECONDS).until(()->!c.isConnected());
        String path="/api/devices/"+device.getDeviceId()+"/reactivate";
        assertThat(rest.exchange(path,HttpMethod.POST,new HttpEntity<>(bearer(viewer)),String.class).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        var response=rest.exchange(path,HttpMethod.POST,new HttpEntity<>(bearer(owner)),com.fasterxml.jackson.databind.JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(devices.findById(device.getDeviceId()).orElseThrow().getLifecycleState()).isEqualTo(LifecycleState.OFFLINE);
        assertThat(ownerships.findByUserAndDevice(owner,device)).isPresent();
        assertThatThrownBy(()->c.connect(options(device.getMqttUsername(),secret))).isInstanceOf(MqttException.class);
        String fresh=response.getBody().path("data").path("password").asText();
        c.connect(options(device.getMqttUsername(),fresh));assertThat(c.isConnected()).isTrue();
        lifecycle.decommissionDevice(device.getDeviceId(),owner,"TEST");
        assertThatThrownBy(()->credentials.reactivate(device.getDeviceId(),owner,"TEST","localhost")).isInstanceOf(com.guardian.exception.BadRequestException.class);
    }
}
