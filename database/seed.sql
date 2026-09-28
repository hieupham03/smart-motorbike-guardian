-- =========================================================================
-- MOTORBIKE GUARDIAN - INITIAL SEED DATA
-- Default Passwords (BCrypt encrypted for Password@123):
-- $2a$10$e8k8WJ6fKjD3o.2L8r127.sFzQY6t3yZ4NqL8u0O1u0Wz2V0qO9b6
-- =========================================================================

-- 1. Default Users
-- admin@guardian.iot / Password@123 (Role: ADMIN)
-- owner@guardian.iot / Password@123 (Role: OWNER)
-- viewer@guardian.iot / Password@123 (Role: VIEWER)

INSERT INTO users (user_id, email, password_hash, full_name, role, status, created_at, updated_at)
VALUES 
('usr-admin-001', 'admin@guardian.iot', '$2a$10$w8.1G2T7qCqY2U2Z0mN6E.x1b1W.w0X6e2C2Y7U3M8N7O9P0Q1R2S', 'System Administrator', 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-owner-001', 'owner@guardian.iot', '$2a$10$w8.1G2T7qCqY2U2Z0mN6E.x1b1W.w0X6e2C2Y7U3M8N7O9P0Q1R2S', 'Nguyen Van A (Chủ xe)', 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr-viewer-001', 'viewer@guardian.iot', '$2a$10$w8.1G2T7qCqY2U2Z0mN6E.x1b1W.w0X6e2C2Y7U3M8N7O9P0Q1R2S', 'Tran Thi B (Người thân)', 'VIEWER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Demo Devices
INSERT INTO devices (device_id, device_uuid, name, license_plate, vehicle_model, lifecycle_state, security_state, firmware_version, hw_version, claim_token, speed_threshold_kmh, battery_low_threshold_v, tilt_threshold_deg, last_speed_kmh, last_battery_v, last_latitude, last_longitude, last_seen_at)
VALUES
('dev-550e8400-0001', '550e8400-e29b-41d4-a716-446655440001', 'Honda SH 150i ABS', '29B1-888.88', 'Honda SH 2024', 'ACTIVE', 'ARMED', 'v1.0.0', 'ESP32-DualNode', 'CLAIM-SH150-2026', 80.0, 11.8, 45.0, 0.0, 12.6, 21.028511, 105.854444, CURRENT_TIMESTAMP),
('dev-550e8400-0002', '550e8400-e29b-41d4-a716-446655440002', 'Yamaha Exciter 155 VVA', '59F2-666.66', 'Exciter 155 2023', 'ACTIVE', 'PARKED', 'v1.0.0', 'ESP32-DualNode', 'CLAIM-EX155-2026', 90.0, 11.5, 50.0, 0.0, 12.4, 21.033333, 105.843333, CURRENT_TIMESTAMP);

-- 3. Device Ownerships
INSERT INTO ownership (id, user_id, device_id, role, granted_at)
VALUES
('own-001', 'usr-owner-001', 'dev-550e8400-0001', 'OWNER', CURRENT_TIMESTAMP),
('own-002', 'usr-owner-001', 'dev-550e8400-0002', 'OWNER', CURRENT_TIMESTAMP),
('own-003', 'usr-viewer-001', 'dev-550e8400-0001', 'VIEWER', CURRENT_TIMESTAMP);
