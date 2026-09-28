package com.guardian.service;

import com.guardian.config.JwtTokenProvider;
import com.guardian.dto.*;
import com.guardian.entity.Role;
import com.guardian.entity.User;
import com.guardian.exception.BadRequestException;
import com.guardian.exception.ResourceNotFoundException;
import com.guardian.exception.UnauthorizedException;
import com.guardian.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional
    public AuthResponse register(RegisterRequest request, String sourceIp) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new BadRequestException("Email đã được đăng ký trên hệ thống");
        }

        String userId = "usr-" + UUID.randomUUID().toString().substring(0, 8);
        Role role = request.getRole() != null ? request.getRole() : Role.OWNER;

        User user = new User(
                userId,
                request.getEmail().toLowerCase().trim(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                role,
                "ACTIVE"
        );

        userRepository.save(user);

        auditLogService.log(user, null, "REGISTER", "SUCCESS", "Đăng ký tài khoản thành công với vai trò " + role, sourceIp);

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return new AuthResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.getAccessTokenExpirationMs(),
                new UserDto(user)
        );
    }

    @Transactional
    public AuthResponse login(AuthRequest request, String sourceIp) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            auditLogService.log(user, null, "LOGIN", "FAILED", "Sai mật khẩu", sourceIp);
            throw new UnauthorizedException("Email hoặc mật khẩu không chính xác");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            auditLogService.log(user, null, "LOGIN", "REJECTED", "Tài khoản bị khoá", sourceIp);
            throw new UnauthorizedException("Tài khoản của bạn đã bị khoá hoặc tạm ngưng");
        }

        auditLogService.log(user, null, "LOGIN", "SUCCESS", "Đăng nhập thành công", sourceIp);

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        return new AuthResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.getAccessTokenExpirationMs(),
                new UserDto(user)
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String email = jwtTokenProvider.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hoá");
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(user);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user);

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                jwtTokenProvider.getAccessTokenExpirationMs(),
                new UserDto(user)
        );
    }

    @Transactional
    public void changePassword(User currentUser, ChangePasswordRequest request, String sourceIp) {
        if (!passwordEncoder.matches(request.getOldPassword(), currentUser.getPasswordHash())) {
            auditLogService.log(currentUser, null, "CHANGE_PASSWORD", "FAILED", "Mật khẩu cũ không đúng", sourceIp);
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }

        currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);

        auditLogService.log(currentUser, null, "CHANGE_PASSWORD", "SUCCESS", "Đổi mật khẩu thành công", sourceIp);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(User currentUser) {
        return new UserDto(currentUser);
    }
}
