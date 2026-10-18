package com.guardian.repository;
import com.guardian.entity.PushDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
public interface PushDeliveryRepository extends JpaRepository<PushDelivery,String>{
 boolean existsByEventKeyAndPushTokenPushTokenId(String eventKey,String pushTokenId);
 List<PushDelivery> findTop100ByStatusAndUpdatedAtBeforeOrderByUpdatedAtAsc(String status, Instant before);
}
