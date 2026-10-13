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
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select d from Device d where d.deviceUuid = :id")
    Optional<Device> findLockedByUuid(@org.springframework.data.repository.query.Param("id") String id);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select d from Device d where d.deviceId = :id")
    Optional<Device> findLockedById(@org.springframework.data.repository.query.Param("id") String id);
    Optional<Device> findByClaimToken(String claimToken);
    List<Device> findByLifecycleState(LifecycleState lifecycleState);
    @org.springframework.data.jpa.repository.Query("select d.deviceId from Device d where d.lifecycleState = com.guardian.entity.LifecycleState.ACTIVE order by d.deviceId")
    List<String> findActiveIds();
}
