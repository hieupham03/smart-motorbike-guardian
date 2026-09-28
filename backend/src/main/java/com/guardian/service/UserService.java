package com.guardian.service;

import com.guardian.dto.UserDto;
import com.guardian.entity.User;
import com.guardian.exception.ResourceNotFoundException;
import com.guardian.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
        return new UserDto(user);
    }

    @Transactional
    public UserDto updateUserStatus(String userId, String status, User adminUser, String sourceIp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        user.setStatus(status.toUpperCase());
        userRepository.save(user);

        auditLogService.log(adminUser, null, "UPDATE_USER_STATUS", "SUCCESS",
                "Cập nhật trạng thái người dùng " + user.getEmail() + " thành " + status, sourceIp);

        return new UserDto(user);
    }
}
