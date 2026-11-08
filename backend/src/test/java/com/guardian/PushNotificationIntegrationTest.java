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
import com.guardian.entity.*;
import com.guardian.dto.AlertDto;
import com.guardian.repository.*;
import com.guardian.service.*;
import java.util.Map;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties={"server.port=0","app.mqtt.enabled=false","app.seed.enabled=false","app.push.receipt-poll-ms=3600000","app.jwt.secret=push-integration-test-signing-key-at-least-32-bytes"})
@ActiveProfiles("h2")
class PushNotificationIntegrationTest {
 @Autowired PushNotificationService push;
 @Autowired UserRepository users;
 @Autowired PushDeliveryRepository deliveries;
 @Autowired DeviceRepository devices;
 @Autowired OwnershipRepository ownerships;
 @Autowired CommandRepository commands;
 @Autowired AlertService alerts;
 @Autowired CommandService commandService;
 @Autowired DevicePresenceService presence;
 @MockBean PushTransport transport;

 @Test void registersAndDeduplicatesWithoutCallingRealExpoService(){
  var user=users.save(new User(UUID.randomUUID().toString(),UUID.randomUUID()+"@example.test","hash","Push Test",Role.OWNER,"ACTIVE"));
  long before=deliveries.count();
  when(transport.send(anyString(),anyString(),anyString(),anyMap())).thenReturn(new PushTransport.Result("ticket-1",null));
  push.register(user,"ExponentPushToken[test-token]","android","install-1");
  push.notifyUser(user,"event-1","Title","Body",Map.of("type","ALERT"));
  push.notifyUser(user,"event-1","Title","Body",Map.of("type","ALERT"));
  verify(transport,times(1)).send(eq("ExponentPushToken[test-token]"),eq("Title"),eq("Body"),anyMap());
  assertThat(deliveries.count()).isEqualTo(before+1);
 }

 @Test void actualAfterCommitAlertCommandAndOfflinePersistPushTickets(){
  var user=users.save(new User(UUID.randomUUID().toString(),UUID.randomUUID()+"@example.test","hash","Push Owner",Role.OWNER,"ACTIVE"));
  var device=devices.save(new Device(UUID.randomUUID().toString(),UUID.randomUUID().toString(),"After commit",null,null));
  ownerships.save(new Ownership(UUID.randomUUID().toString(),user,device,Role.OWNER));
  String token="ExponentPushToken["+UUID.randomUUID()+"]";
  push.register(user,token,"android","after-commit-install");
  when(transport.send(eq(token),anyString(),anyString(),anyMap())).thenReturn(new PushTransport.Result("committed-ticket",null));
  var alert=new AlertDto();alert.setReason("SPEED_LIMIT_EXCEEDED");alert.setAlertId(UUID.randomUUID().toString());
  var saved=alerts.processAlert(device.getDeviceUuid(),alert);
  assertThat(deliveries.findAll()).anySatisfy(row->{
   assertThat(row.getEventKey()).isEqualTo("alert:"+saved.getAlertId());
   assertThat(row.getStatus()).isEqualTo("TICKET");assertThat(row.getTicketId()).isEqualTo("committed-ticket");
  });
  var command=commands.save(new Command(UUID.randomUUID().toString(),device,user,CommandType.ARM,null));
  commandService.processCommandAck(device.getDeviceUuid(),command.getCmdId(),"EXECUTED",null);
  assertThat(deliveries.findAll()).anySatisfy(row->{assertThat(row.getEventKey()).contains(command.getCmdId());assertThat(row.getStatus()).isEqualTo("TICKET");});
  presence.status(device.getDeviceUuid(),false,null);
  assertThat(deliveries.findAll()).anySatisfy(row->{assertThat(row.getEventKey()).startsWith("offline:"+device.getDeviceId());assertThat(row.getStatus()).isEqualTo("TICKET");});
  verify(transport,times(3)).send(eq(token),anyString(),anyString(),anyMap());
 }
}
