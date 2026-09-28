package com.guardian.repository;

import com.guardian.entity.Command;
import com.guardian.entity.CommandStatus;
import com.guardian.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommandRepository extends JpaRepository<Command, String> {
    List<Command> findByDeviceOrderByIssuedAtDesc(Device device);
    List<Command> findByDeviceAndStatus(Device device, CommandStatus status);
}
