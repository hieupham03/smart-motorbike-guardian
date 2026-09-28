package com.guardian.repository;

import com.guardian.entity.AuditLog;
import com.guardian.entity.Device;
import com.guardian.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
    List<AuditLog> findByUserOrderByCreatedAtDesc(User user);
    List<AuditLog> findByDeviceOrderByCreatedAtDesc(Device device);
}
