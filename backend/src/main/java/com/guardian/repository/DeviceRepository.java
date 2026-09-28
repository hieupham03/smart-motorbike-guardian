package com.guardian.repository;

import com.guardian.entity.Device;
import com.guardian.entity.LifecycleState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, String> {
    Optional<Device> findByDeviceUuid(String deviceUuid);
    Optional<Device> findByClaimToken(String claimToken);
    List<Device> findByLifecycleState(LifecycleState lifecycleState);
}
