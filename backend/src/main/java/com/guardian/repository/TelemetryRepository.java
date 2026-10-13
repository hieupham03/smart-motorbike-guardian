package com.guardian.repository;

import com.guardian.entity.Device;
import com.guardian.entity.TelemetryReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelemetryRepository extends JpaRepository<TelemetryReading, String> {
    List<TelemetryReading> findTop50ByDeviceOrderByTsDesc(Device device);
    
    @Query("SELECT t FROM TelemetryReading t WHERE t.device = :device AND t.ts >= :fromTs AND t.ts <= :toTs ORDER BY t.ts ASC")
    List<TelemetryReading> findByDeviceAndTsRange(@Param("device") Device device, @Param("fromTs") Long fromTs, @Param("toTs") Long toTs);

    java.util.Optional<TelemetryReading> findFirstByDeviceOrderByTsDescCreatedAtDesc(Device device);
    List<TelemetryReading> findByDeviceAndTsBetweenOrderByTsDescCreatedAtDesc(Device device, Long from, Long to, org.springframework.data.domain.Pageable page);

    void deleteByDevice(Device device);
}
