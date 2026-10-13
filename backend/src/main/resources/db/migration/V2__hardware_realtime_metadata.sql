-- Existing readings are preserved as LEGACY, never reclassified as measured hardware.
ALTER TABLE devices ADD COLUMN data_source VARCHAR(255);
ALTER TABLE devices ADD COLUMN sensor_connected BOOLEAN;
ALTER TABLE devices ADD COLUMN imu_valid BOOLEAN;
ALTER TABLE devices ADD COLUMN speed_valid BOOLEAN;
ALTER TABLE devices ADD COLUMN gps_valid BOOLEAN;
ALTER TABLE devices ADD COLUMN gps_age_ms BIGINT;
ALTER TABLE devices ADD COLUMN last_telemetry_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE devices ADD COLUMN last_location_received_at TIMESTAMP WITH TIME ZONE;
UPDATE devices SET data_source = 'HARDWARE', last_speed_kmh = NULL, last_battery_v = NULL,
    last_latitude = NULL, last_longitude = NULL, last_seen_at = NULL,
    sensor_connected = FALSE, imu_valid = FALSE, speed_valid = FALSE, gps_valid = FALSE;
UPDATE devices SET lifecycle_state = 'OFFLINE' WHERE lifecycle_state = 'ACTIVE';
ALTER TABLE devices ALTER COLUMN last_speed_kmh DROP DEFAULT;
ALTER TABLE devices ALTER COLUMN last_battery_v DROP DEFAULT;
ALTER TABLE devices ALTER COLUMN last_latitude DROP DEFAULT;
ALTER TABLE devices ALTER COLUMN last_longitude DROP DEFAULT;

ALTER TABLE telemetry_readings ADD COLUMN data_source VARCHAR(255);
ALTER TABLE telemetry_readings ADD COLUMN sensor_connected BOOLEAN;
ALTER TABLE telemetry_readings ADD COLUMN imu_valid BOOLEAN;
ALTER TABLE telemetry_readings ADD COLUMN speed_valid BOOLEAN;
ALTER TABLE telemetry_readings ADD COLUMN gps_valid BOOLEAN;
ALTER TABLE telemetry_readings ADD COLUMN gps_age_ms BIGINT;
ALTER TABLE telemetry_readings ADD COLUMN device_uptime_s BIGINT;
ALTER TABLE telemetry_readings ADD COLUMN received_at TIMESTAMP WITH TIME ZONE;
UPDATE telemetry_readings SET data_source = 'LEGACY', received_at = created_at;
ALTER TABLE telemetry_readings ALTER COLUMN speed_kmh DROP DEFAULT;
ALTER TABLE telemetry_readings ALTER COLUMN battery_v DROP DEFAULT;
ALTER TABLE telemetry_readings ALTER COLUMN accel_x DROP DEFAULT;
ALTER TABLE telemetry_readings ALTER COLUMN accel_y DROP DEFAULT;
ALTER TABLE telemetry_readings ALTER COLUMN accel_z DROP DEFAULT;

ALTER TABLE commands ADD COLUMN late_ack_result VARCHAR(255);
ALTER TABLE commands ADD COLUMN late_ack_reason VARCHAR(255);
ALTER TABLE commands ADD COLUMN late_ack_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE alerts ADD COLUMN source_alert_id VARCHAR(255);
ALTER TABLE alerts ADD COLUMN device_uptime_s BIGINT;
ALTER TABLE alerts ADD COLUMN data_source VARCHAR(255);
UPDATE alerts SET data_source = 'LEGACY';
ALTER TABLE alerts ADD CONSTRAINT uq_device_source_alert UNIQUE (device_id, source_alert_id);
