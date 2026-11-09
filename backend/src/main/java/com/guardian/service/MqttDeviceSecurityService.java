package com.guardian.service;

import com.guardian.entity.*;
import com.guardian.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;

/** Database-backed device identity and topic scope, shared by the embedded broker hooks. */
@Service
public class MqttDeviceSecurityService {
    private final DeviceRepository devices;
    private final PasswordEncoder passwords;
    private final String serviceUser;
    private final String servicePassword;
    private static final Set<String> OUTGOING = Set.of("telemetry", "status", "heartbeat", "wheel_session", "alert", "event", "cmd/ack");
    private static final Set<String> COMMANDS = Set.of("arm", "disarm", "lock_engine", "unlock_engine", "siren_on", "siren_off", "reboot", "reset_wheel_session", "config_thresholds");

    public MqttDeviceSecurityService(DeviceRepository devices, PasswordEncoder passwords,
            @Value("${app.mqtt.username:}") String serviceUser, @Value("${app.mqtt.password:}") String servicePassword) {
        this.devices=devices; this.passwords=passwords; this.serviceUser=serviceUser; this.servicePassword=servicePassword;
    }
    public boolean serviceCredentialsConfigured() { return !serviceUser.isBlank() && servicePassword.length() >= 16; }
    private boolean service(String username) { return serviceCredentialsConfigured() && serviceUser.equals(username); }
    public static boolean deviceEnabled(Device device) {
        return "HARDWARE".equals(device.getDataSource()) && device.getMqttPasswordHash()!=null &&
            (device.getLifecycleState()==LifecycleState.ACTIVE || device.getLifecycleState()==LifecycleState.OFFLINE);
    }
    public boolean authenticate(String client, String user, byte[] password) {
        if (user==null || password==null || password.length>256) return false;
        if (service(user)) return client!=null && client.startsWith("guardian-backend-service-") &&
            MessageDigest.isEqual(servicePassword.getBytes(StandardCharsets.UTF_8),password);
        Device d=devices.findByMqttUsername(user).orElse(null);
        return d!=null && deviceEnabled(d) && ("Guardian-"+d.getDeviceUuid()).equals(client) &&
            passwords.matches(new String(password,StandardCharsets.UTF_8),d.getMqttPasswordHash());
    }
    public boolean canWrite(String topic,String user,String client) {
        if (service(user)) {
            String[] p=topic.split("/",-1);
            return p.length==4 && p[0].equals("guardian") && p[1].matches("[A-Za-z0-9-]{1,64}") && p[2].equals("cmd") && COMMANDS.contains(p[3]);
        }
        Device d=user==null?null:devices.findByMqttUsername(user).orElse(null);
        if (d==null || !deviceEnabled(d) || !("Guardian-"+d.getDeviceUuid()).equals(client)) return false;
        String prefix="guardian/"+d.getDeviceUuid()+"/";
        return topic.startsWith(prefix) && OUTGOING.contains(topic.substring(prefix.length()));
    }
    public boolean canRead(String topic,String user,String client) {
        if (service(user)) {
            if (OUTGOING.stream().anyMatch(s -> topic.equals("guardian/+/"+s))) return true;
            String[] p=topic.split("/",3);
            return p.length==3 && p[0].equals("guardian") && p[1].matches("[A-Za-z0-9-]{1,64}") && OUTGOING.contains(p[2]);
        }
        Device d=user==null?null:devices.findByMqttUsername(user).orElse(null);
        if (d==null || !deviceEnabled(d) || !("Guardian-"+d.getDeviceUuid()).equals(client)) return false;
        String prefix="guardian/"+d.getDeviceUuid()+"/cmd/";
        return topic.startsWith(prefix) && (topic.equals(prefix+"#") || topic.equals(prefix+"+") || COMMANDS.contains(topic.substring(prefix.length())) || topic.equals(prefix+"ack"));
    }
}
