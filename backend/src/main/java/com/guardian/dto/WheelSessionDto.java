package com.guardian.dto;

import java.time.Instant;

/** Latest RAM-only wheel session. Values are wheel rotation equivalents, not GPS travel. */
public record WheelSessionDto(String deviceId, String sessionId, long sequence, long sourceBootId,
        long pulseCount, double revolutions, double distanceM, double maxSpeedKmh,
        long movingMs, long elapsedMs, boolean fresh, boolean overspeedActive,
        double speedLimitKmh, double circumferenceM, long pulsesPerRev, Instant receivedAt,
        boolean speedLimitConfigurable) {
    public WheelSessionDto withFresh(boolean value) {
        return new WheelSessionDto(deviceId, sessionId, sequence, sourceBootId, pulseCount, revolutions,
                distanceM, maxSpeedKmh, movingMs, elapsedMs, value, overspeedActive,
                speedLimitKmh, circumferenceM, pulsesPerRev, receivedAt, speedLimitConfigurable);
    }
}
