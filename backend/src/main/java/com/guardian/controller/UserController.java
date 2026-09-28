package com.guardian.controller;

import com.guardian.dto.ApiResponse;
import com.guardian.dto.UserDto;
import com.guardian.entity.User;
import com.guardian.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "Thông tin cá nhân người dùng")
public class UserController {

    @Autowired
    private AuthService authService;

    @GetMapping("/me")
    @Operation(summary = "Xem thông tin tài khoản hiện tại")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        UserDto userDto = authService.getCurrentUser(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(userDto));
    }
}
