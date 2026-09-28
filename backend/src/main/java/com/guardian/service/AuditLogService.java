package com.guardian.service;

import com.guardian.dto.AuditLogDto;
import com.guardian.entity.AuditLog;
import com.guardian.entity.Device;
import com.guardian.entity.User;
import com.guardian.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Transactional
    public void log(User user, Device device, String action, String result, String details, String sourceIp) {
        String logId = "log-" + UUID.randomUUID().toString().substring(0, 8);
        AuditLog log = new AuditLog(logId, user, device, action, result, details, sourceIp);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAllLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(AuditLogDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getLogsByUser(User user) {
        return auditLogRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(AuditLogDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getLogsByDevice(Device device) {
        return auditLogRepository.findByDeviceOrderByCreatedAtDesc(device).stream()
                .map(AuditLogDto::new)
                .collect(Collectors.toList());
    }
}
