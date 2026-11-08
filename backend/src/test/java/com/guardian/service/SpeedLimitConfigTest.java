package com.guardian.service;

import com.guardian.entity.*;
import com.guardian.exception.BadRequestException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class SpeedLimitConfigTest {
    @Test void validatesNumbersWithoutCoercionOrAdditionalSettings() {
        assertThat(SpeedLimitConfig.parse("{\"speed_limit_kmh\":1}").get("speed_limit_kmh").asDouble()).isEqualTo(1);
        assertThat(SpeedLimitConfig.parse("{\"speed_limit_kmh\":120}").get("speed_limit_kmh").asDouble()).isEqualTo(120);
        for (String input : new String[]{"null", "[]", "{}", "{bad", "{\"speed_limit_kmh\":true}",
                "{\"speed_limit_kmh\":\"5\"}", "{\"speed_limit_kmh\":null}", "{\"speed_limit_kmh\":0}",
                "{\"speed_limit_kmh\":121}", "{\"speed_limit_kmh\":5,\"tilt\":30}"})
            assertThatThrownBy(() -> SpeedLimitConfig.parse(input)).isInstanceOf(BadRequestException.class);
    }

    @Test void mqttDispatchCarriesTheValidatedValueAndKeepsOtherCommandsUnchanged() throws Exception {
        var command = new Command("test-config", new Device(), new User(), CommandType.CONFIG_THRESHOLDS, "{\"speed_limit_kmh\":5.5}");
        var packet = new ObjectMapper().readTree(CommandDispatchService.mqttPayload(command));
        assertThat(packet.get("speed_limit_kmh").asDouble()).isEqualTo(5.5);
        assertThat(packet.get("cmd_id").asText()).isEqualTo("test-config");
        assertThat(packet.get("type").asText()).isEqualTo("CONFIG_THRESHOLDS");
        command = new Command("test-arm", new Device(), new User(), CommandType.ARM, "{\"speed_limit_kmh\":999}");
        assertThat(new ObjectMapper().readTree(CommandDispatchService.mqttPayload(command)).has("speed_limit_kmh")).isFalse();
    }
}
