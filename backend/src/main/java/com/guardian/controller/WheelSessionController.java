package com.guardian.controller;

import com.guardian.dto.ApiResponse;
import com.guardian.dto.WheelSessionDto;
import com.guardian.entity.User;
import com.guardian.service.WheelSessionService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/devices/{id}/wheel-session")
public class WheelSessionController {
    private final WheelSessionService sessions;
    public WheelSessionController(WheelSessionService sessions) { this.sessions=sessions; }
    @GetMapping public ApiResponse<WheelSessionDto> get(@PathVariable String id, @AuthenticationPrincipal User user) {
        return ApiResponse.ok(sessions.get(id,user));
    }
}
