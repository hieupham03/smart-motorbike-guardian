package com.guardian;

import com.guardian.entity.Role;
import com.guardian.entity.User;
import com.guardian.repository.PushDeliveryRepository;
import com.guardian.repository.UserRepository;
import com.guardian.service.PushNotificationService;
import com.guardian.service.PushTransport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties={"server.port=0","app.mqtt.enabled=false","app.seed.enabled=false","app.push.receipt-poll-ms=3600000","app.jwt.secret=push-integration-test-signing-key-at-least-32-bytes"})
@ActiveProfiles("h2")
@Transactional
class PushNotificationIntegrationTest {
 @Autowired PushNotificationService push;
 @Autowired UserRepository users;
 @Autowired PushDeliveryRepository deliveries;
 @MockBean PushTransport transport;

 @Test void registersAndDeduplicatesWithoutCallingRealExpoService(){
  var user=users.save(new User(UUID.randomUUID().toString(),"push@example.test","hash","Push Test",Role.OWNER,"ACTIVE"));
  when(transport.send(anyString(),anyString(),anyString(),anyMap())).thenReturn(new PushTransport.Result("ticket-1",null));
  push.register(user,"ExponentPushToken[test-token]","android","install-1");
  push.notifyUser(user,"event-1","Title","Body",Map.of("type","ALERT"));
  push.notifyUser(user,"event-1","Title","Body",Map.of("type","ALERT"));
  verify(transport,times(1)).send(eq("ExponentPushToken[test-token]"),eq("Title"),eq("Body"),anyMap());
  assertThat(deliveries.count()).isEqualTo(1);
 }
}
