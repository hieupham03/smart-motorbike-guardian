package com.guardian.repository;

import com.guardian.entity.Command;
import com.guardian.entity.CommandStatus;
import com.guardian.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommandRepository extends JpaRepository<Command, String> {
    List<Command> findTop100ByDeviceOrderByIssuedAtDesc(Device device);
    List<Command> findByDeviceAndStatus(Device device, CommandStatus status);
    List<Command> findByStatusAndIssuedAtBefore(CommandStatus status, java.time.Instant cutoff);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from Command c where c.cmdId = :id")
    java.util.Optional<Command> findLockedById(@org.springframework.data.repository.query.Param("id") String id);
}
