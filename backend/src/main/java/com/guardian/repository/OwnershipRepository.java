package com.guardian.repository;

import com.guardian.entity.Device;
import com.guardian.entity.Ownership;
import com.guardian.entity.Role;
import com.guardian.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OwnershipRepository extends JpaRepository<Ownership, String> {
    List<Ownership> findByUser(User user);
    List<Ownership> findByDevice(Device device);
    Optional<Ownership> findByUserAndDevice(User user, Device device);
    boolean existsByUserAndDeviceAndRole(User user, Device device, Role role);
    void deleteByUserAndDevice(User user, Device device);
}
