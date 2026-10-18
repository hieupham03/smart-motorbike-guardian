package com.guardian.service;

import com.guardian.entity.*;
import com.guardian.repository.*;
import org.slf4j.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;

@Service
public class PushNotificationService {
 private static final Logger log=LoggerFactory.getLogger(PushNotificationService.class);
 private final PushTokenRepository tokens; private final PushDeliveryRepository deliveries; private final OwnershipRepository ownerships; private final UserRepository users; private final PushTransport transport;
 public PushNotificationService(PushTokenRepository t,PushDeliveryRepository d,OwnershipRepository o,UserRepository u,PushTransport p){tokens=t;deliveries=d;ownerships=o;users=u;transport=p;}
 @Transactional public void register(User user,String token,String platform,String installationId){
  PushToken installation=tokens.findByUserAndInstallationId(user,installationId).orElse(null);
  PushToken target=tokens.findByExpoToken(token).orElse(null);
  if(target!=null&&installation!=null&&!target.getPushTokenId().equals(installation.getPushTokenId())){tokens.delete(installation);tokens.flush();}
  if(target==null) target=installation!=null?installation:new PushToken(UUID.randomUUID().toString(),user,token,platform.toLowerCase(),installationId);
  target.setUser(user); target.setExpoToken(token); target.setPlatform(platform.toLowerCase()); target.setInstallationId(installationId); target.setActive(true); tokens.save(target);
 }
 @Transactional public void unregister(User user,String installationId){tokens.findByUserAndInstallationId(user,installationId).ifPresent(token->{token.setActive(false);tokens.save(token);});}
 @Transactional public void notifyDevice(Device device,String eventKey,String title,String body,Map<String,Object> data){
  LinkedHashMap<String,User> recipients=new LinkedHashMap<>(); ownerships.findByDevice(device).forEach(o->{if("ACTIVE".equals(o.getUser().getStatus()))recipients.put(o.getUser().getUserId(),o.getUser());});
  users.findAll().stream().filter(u->u.getRole()==Role.ADMIN&&"ACTIVE".equals(u.getStatus())).forEach(u->recipients.put(u.getUserId(),u));
  send(recipients.values(),eventKey,title,body,data);
 }
 @Transactional public void notifyUser(User user,String eventKey,String title,String body,Map<String,Object> data){send(List.of(user),eventKey,title,body,data);}
 private void send(Collection<User> recipients,String eventKey,String title,String body,Map<String,Object> data){
  for(PushToken token:tokens.findByUserInAndActiveTrue(recipients)){
   if(deliveries.existsByEventKeyAndPushTokenPushTokenId(eventKey,token.getPushTokenId()))continue;
   PushDelivery delivery=new PushDelivery(UUID.randomUUID().toString(),eventKey,token);
   try{deliveries.saveAndFlush(delivery);}catch(DataIntegrityViolationException duplicate){continue;}
   try{PushTransport.Result result=transport.send(token.getExpoToken(),title,body,data); applyResult(delivery,result,false);}catch(Exception e){delivery.setStatus("FAILED");delivery.setErrorCode("TRANSPORT_ERROR");deliveries.save(delivery);log.warn("Push send failed for event {}: {}",eventKey,e.getMessage());}
  }
 }
 private void applyResult(PushDelivery delivery,PushTransport.Result result,boolean receipt){
  if(result.accepted()&&result.errorCode()==null){delivery.setTicketId(result.ticketId());delivery.setErrorCode(null);delivery.setStatus(receipt?"DELIVERED":"TICKET");}
  else if("PENDING_RECEIPT".equals(result.errorCode())) return;
  else{delivery.setStatus("FAILED");delivery.setErrorCode(result.errorCode());if("DeviceNotRegistered".equals(result.errorCode())){PushToken token=delivery.getPushToken();token.setActive(false);tokens.save(token);}}
  deliveries.save(delivery);
 }
 @Scheduled(fixedDelayString="${app.push.receipt-poll-ms:60000}") @Transactional public void pollReceipts(){
  for(PushDelivery delivery:deliveries.findTop100ByStatusAndUpdatedAtBeforeOrderByUpdatedAtAsc("TICKET",Instant.now().minusSeconds(15))){
   try{applyResult(delivery,transport.receipt(delivery.getTicketId()),true);}catch(Exception e){log.warn("Push receipt check failed: {}",e.getMessage());}
  }
 }
}
