package com.guardian.controller;

import com.guardian.dto.ApiResponse;
import com.guardian.service.VirtualDeviceSimulatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/simulator")
@Tag(name = "Hardware Simulator", description = "Mô phỏng tín hiệu phần cứng Testbed (Tốc độ, Cảm biến rung, Ngã xe, Ắc quy)")
public class VirtualDeviceController {

    @Autowired
    private VirtualDeviceSimulatorService simulatorService;

    @PostMapping("/action")
    @Operation(summary = "Mô phỏng hành động phần cứng trên xe (SET_SPEED, TRIGGER_FALL, SET_BATTERY, TRIGGER_THEFT_TAMPER)")
    public ResponseEntity<ApiResponse<String>> triggerSimulatedAction(@RequestBody Map<String, Object> body) {
        String deviceId = (String) body.get("deviceId");
        String action = (String) body.get("action");
        Double value = null;
        if (body.containsKey("value") && body.get("value") != null) {
            value = Double.valueOf(body.get("value").toString());
        }

        simulatorService.simulateVehicleAction(deviceId, action, value);
        return ResponseEntity.ok(ApiResponse.ok("Mô phỏng thành công hành vi: " + action, null));
    }

    @PostMapping("/toggle")
    @Operation(summary = "Bật / tắt chế độ tự động phát sinh dữ liệu cảm biến ngầm")
    public ResponseEntity<ApiResponse<Boolean>> toggleSimulation(@RequestParam("enabled") boolean enabled) {
        simulatorService.setSimulationEnabled(enabled);
        return ResponseEntity.ok(ApiResponse.ok("Trạng thái giả lập ngầm: " + enabled, enabled));
    }
}
