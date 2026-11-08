package com.guardian.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guardian.exception.BadRequestException;

/** One validated payload contract for REST storage and MQTT dispatch. */
public final class SpeedLimitConfig {
    private static final ObjectMapper JSON = new ObjectMapper();
    private SpeedLimitConfig() {}

    public static JsonNode parse(String payload) {
        try {
            JsonNode node = payload == null ? null : JSON.readTree(payload);
            JsonNode limit = node == null ? null : node.get("speed_limit_kmh");
            if (node == null || !node.isObject() || node.size() != 1 || limit == null ||
                    !limit.isNumber() || !Double.isFinite(limit.asDouble()) ||
                    limit.asDouble() < 1 || limit.asDouble() > 120) throw new IllegalArgumentException();
            return node;
        } catch (Exception error) {
            throw new BadRequestException("Ngưỡng cảnh báo tốc độ phải là số từ 1 đến 120 km/h.");
        }
    }
}
