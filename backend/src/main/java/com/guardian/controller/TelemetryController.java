package com.guardian.controller;

import com.guardian.dto.ApiResponse;
import com.guardian.dto.TelemetryDto;
import com.guardian.entity.User;
import com.guardian.service.TelemetryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices/{id}/telemetry")
@Tag(name = "Telemetry & Analytics", description = "Thu thập, phân tích và xuất dữ liệu cảm biến thời gian thực")
public class TelemetryController {

    @Autowired
    private TelemetryService telemetryService;

    @GetMapping
    @Operation(summary = "Tra cứu dữ liệu telemetry lịch sử theo khoảng thời gian")
    public ResponseEntity<ApiResponse<List<TelemetryDto>>> getTelemetryHistory(
            @PathVariable("id") String deviceId,
            @RequestParam(value = "from", required = false) Long fromTs,
            @RequestParam(value = "to", required = false) Long toTs,
            @AuthenticationPrincipal User currentUser) {
        List<TelemetryDto> readings = telemetryService.getTelemetryHistory(deviceId, fromTs, toTs, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(readings));
    }

    @GetMapping("/export")
    @Operation(summary = "Xuất dữ liệu telemetry dưới định dạng CSV")
    public ResponseEntity<byte[]> exportCsv(
            @PathVariable("id") String deviceId,
            @RequestParam(value = "from", required = false) Long fromTs,
            @RequestParam(value = "to", required = false) Long toTs,
            @AuthenticationPrincipal User currentUser) {
        byte[] csvData = telemetryService.exportCsv(deviceId, fromTs, toTs, currentUser);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=telemetry_" + deviceId + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @PostMapping
    @Operation(summary = "Ghi nhận bản tin telemetry trực tiếp qua REST API (Fallback)")
    public ResponseEntity<ApiResponse<TelemetryDto>> postTelemetry(
            @PathVariable("id") String deviceId,
            @RequestBody TelemetryDto dto) {
        dto.setDeviceId(deviceId);
        TelemetryDto saved = telemetryService.recordTelemetry(deviceId, dto);
        return ResponseEntity.ok(ApiResponse.ok("Đã ghi nhận telemetry", saved));
    }
}
