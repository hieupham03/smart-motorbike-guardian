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

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized, skipping seed.");
            return;
        }

        log.info("Seeding initial data for Smart Motorbike Guardian...");

        String defaultPass = passwordEncoder.encode("Password@123");

        // 1. Users
        User admin = new User("usr-admin-001", "admin@guardian.iot", defaultPass, "System Administrator", Role.ADMIN, "ACTIVE");
        User owner = new User("usr-owner-001", "owner@guardian.iot", defaultPass, "Nguyễn Văn An (Chủ xe)", Role.OWNER, "ACTIVE");
        User viewer = new User("usr-viewer-001", "viewer@guardian.iot", defaultPass, "Trần Thị Bình (Người thân)", Role.VIEWER, "ACTIVE");

        userRepository.save(admin);
        userRepository.save(owner);
        userRepository.save(viewer);

        // 2. Devices
        Device dev1 = new Device("dev-550e8400-0001", "550e8400-e29b-41d4-a716-446655440001", "Honda SH 150i ABS", "29B1-888.88", "Honda SH 2024");
        dev1.setLifecycleState(LifecycleState.ACTIVE);
        dev1.setSecurityState(SecurityState.ARMED);
        dev1.setSpeedThresholdKmh(80.0);
        dev1.setBatteryLowThresholdV(11.8);
        dev1.setTiltThresholdDeg(45.0);
        dev1.setLastSpeedKmh(0.0);
        dev1.setLastBatteryV(12.6);
        dev1.setLastLatitude(21.028511);
        dev1.setLastLongitude(105.854444);
        dev1.setLastSeenAt(Instant.now());
        dev1.setClaimToken("CLAIM-SH150-2026");

        Device dev2 = new Device("dev-550e8400-0002", "550e8400-e29b-41d4-a716-446655440002", "Yamaha Exciter 155 VVA", "59F2-666.66", "Yamaha Exciter 2023");
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

        // 4. Initial Sample Telemetry
        long now = Instant.now().getEpochSecond();
        for (int i = 20; i >= 0; i--) {
            long ts = now - (i * 60);
            double spd = (i < 5) ? 0.0 : (20 + (i % 10) * 3.5);
            telemetryRepository.save(new TelemetryReading(
                    "tel-seed-" + i,
                    dev1,
                    spd,
                    12.6 - (i * 0.01),
                    0.02,
                    0.01,
                    0.99,
                    21.028511 + (i * 0.0001),
                    105.854444 + (i * 0.0001),
                    dev1.getSecurityState().name(),
                    ts
            ));
        }

        // 5. Initial Sample Alerts
        Alert alert1 = new Alert(
                "alt-seed-001",
                dev1,
                "MOTION_WHILE_ARMED",
                AlertSeverity.HIGH,
                "ALARM_TRIGGERED",
                "Phát hiện dịch chuyển bất thường trong lúc xe đang bật chế độ canh giữ."
        );
        alert1.setStatus(AlertStatus.OPEN);

        Alert alert2 = new Alert(
                "alt-seed-002",
                dev2,
                "LOW_BATTERY",
                AlertSeverity.LOW,
                "NOTIFIED_OWNER",
                "Điện áp ắc quy giảm xuống 11.4V, vui lòng kiểm tra nguồn sạc."
        );
        alert2.setStatus(AlertStatus.RESOLVED);
        alert2.setResolvedBy(owner);
        alert2.setResolvedAt(Instant.now().minusSeconds(3600));

        alertRepository.save(alert1);
        alertRepository.save(alert2);

        log.info("Initial data seeded successfully!");
        log.info("Default Accounts:");
        log.info("  Admin:  admin@guardian.iot  / Password@123");
        log.info("  Owner:  owner@guardian.iot  / Password@123");
        log.info("  Viewer: viewer@guardian.iot / Password@123");
    }
}
