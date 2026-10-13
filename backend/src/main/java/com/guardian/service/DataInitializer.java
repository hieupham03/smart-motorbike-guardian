package com.guardian.service;

import com.guardian.entity.*;
import com.guardian.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private OwnershipRepository ownershipRepository;

    @Autowired
    private TelemetryRepository telemetryRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.seed.password:}")
    private String demoPassword;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized, skipping seed.");
            return;
        }

        log.info("Seeding initial data for Smart Motorbike Guardian...");

        if (demoPassword == null || demoPassword.length() < 8) throw new IllegalStateException("DEMO_PASSWORD requires at least 8 characters");
        String defaultPass = passwordEncoder.encode(demoPassword);

        // 1. Users
        User admin = new User("usr-admin-001", "admin@guardian.iot", defaultPass, "System Administrator", Role.ADMIN, "ACTIVE");
        User owner = new User("usr-owner-001", "owner@guardian.iot", defaultPass, "Nguyễn Văn An (Chủ xe)", Role.OWNER, "ACTIVE");
        User viewer = new User("usr-viewer-001", "viewer@guardian.iot", defaultPass, "Trần Thị Bình (Người thân)", Role.VIEWER, "ACTIVE");

        userRepository.save(admin);
        userRepository.save(owner);
        userRepository.save(viewer);

        // 2. Devices
        Device dev1 = new Device("dev-550e8400-0001", "550e8400-e29b-41d4-a716-446655440001", "Honda SH 150i ABS", "29B1-888.88", "Honda SH 2024");
        dev1.setLifecycleState(LifecycleState.OFFLINE);
        dev1.setSecurityState(SecurityState.PARKED);
        dev1.setSpeedThresholdKmh(80.0);
        dev1.setBatteryLowThresholdV(11.8);
        dev1.setTiltThresholdDeg(45.0);
        dev1.setClaimToken("CLAIM-SH150-2026");

        Device dev2 = new Device("dev-550e8400-0002", "550e8400-e29b-41d4-a716-446655440002", "Yamaha Exciter 155 VVA", "59F2-666.66", "Yamaha Exciter 2023");
        dev2.setDataSource("SIMULATED");
        dev2.setLifecycleState(LifecycleState.ACTIVE);
        dev2.setSecurityState(SecurityState.PARKED);
        dev2.setSpeedThresholdKmh(90.0);
        dev2.setBatteryLowThresholdV(11.5);
        dev2.setTiltThresholdDeg(50.0);
        dev2.setLastSpeedKmh(0.0);
        dev2.setLastBatteryV(12.4);
        dev2.setLastLatitude(21.033333);
        dev2.setLastLongitude(105.843333);
        dev2.setLastSeenAt(Instant.now());
        dev2.setClaimToken("CLAIM-EX155-2026");

        // Device pending onboarding
        Device dev3 = new Device("dev-550e8400-0003", "550e8400-e29b-41d4-a716-446655440003", "VinFast Theon S (Chưa kích hoạt)", "30A1-999.99", "VinFast 2024");
        dev3.setLifecycleState(LifecycleState.PROVISIONED);
        dev3.setClaimToken("GUARDIAN-QR-2026");

        deviceRepository.save(dev1);
        deviceRepository.save(dev2);
        deviceRepository.save(dev3);

        // 3. Ownerships
        ownershipRepository.save(new Ownership("own-001", owner, dev1, Role.OWNER));
        ownershipRepository.save(new Ownership("own-002", owner, dev2, Role.OWNER));
        ownershipRepository.save(new Ownership("own-003", viewer, dev1, Role.VIEWER));

        log.info("Initial data seeded successfully!");
    }
}
