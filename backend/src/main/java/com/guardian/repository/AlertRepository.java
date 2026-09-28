package com.guardian.repository;

import com.guardian.entity.Alert;
import com.guardian.entity.AlertStatus;
import com.guardian.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, String> {
    List<Alert> findByOrderByCreatedAtDesc();
    List<Alert> findByDeviceOrderByCreatedAtDesc(Device device);
    List<Alert> findByDeviceAndStatusOrderByCreatedAtDesc(Device device, AlertStatus status);
    List<Alert> findByStatusOrderByCreatedAtDesc(AlertStatus status);
    long countByStatus(AlertStatus status);
}
