package com.guardian.config;

import com.guardian.entity.*;
import com.guardian.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** One-time bootstrap for the existing physical classroom node. Never restores revoked access. */
@Component @Order(1)
@ConditionalOnProperty(name="app.mqtt.embedded.enabled",havingValue="true")
public class DemoDeviceCredentialInitializer implements ApplicationRunner {
    private final DeviceRepository devices;
    private final PasswordEncoder passwords;
    private final String password;
    public DemoDeviceCredentialInitializer(DeviceRepository devices,PasswordEncoder passwords,
            @Value("${app.mqtt.demo-device-password:}") String password) {
        this.devices=devices;this.passwords=passwords;this.password=password;
    }
    @Override @Transactional public void run(ApplicationArguments args) {
        if(password.isBlank()) return;
        if(password.length()<16) throw new IllegalStateException("DEMO_DEVICE_MQTT_PASSWORD requires at least 16 characters");
        devices.findByDeviceUuid("550e8400-e29b-41d4-a716-446655440001").ifPresent(d->{
            if(d.getMqttPasswordHash()==null && d.getMqttUsername()==null &&
                    d.getLifecycleState()!=LifecycleState.FAULT && d.getLifecycleState()!=LifecycleState.DECOMMISSIONED) {
                d.setMqttUsername("device-"+d.getDeviceUuid());d.setMqttPasswordHash(passwords.encode(password));devices.save(d);
            }
        });
    }
}
