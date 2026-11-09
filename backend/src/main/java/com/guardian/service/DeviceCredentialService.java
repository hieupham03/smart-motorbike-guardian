package com.guardian.service;

import com.guardian.config.EmbeddedMqttBroker;
import com.guardian.dto.MqttCredentialResponse;
import com.guardian.entity.*;
import com.guardian.exception.BadRequestException;
import com.guardian.repository.DeviceRepository;
import com.guardian.repository.OwnershipRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class DeviceCredentialService {
    private final DeviceService access;
    private final DeviceRepository devices;
    private final OwnershipRepository ownerships;
    private final PasswordEncoder passwords;
    private final AuditLogService audit;
    private final RealtimeService realtime;
    private final ObjectProvider<EmbeddedMqttBroker> broker;
    private final boolean embeddedEnabled;
    private final int port;
    private final String advertisedHost;
    public DeviceCredentialService(DeviceService access,DeviceRepository devices,OwnershipRepository ownerships,PasswordEncoder passwords,
            AuditLogService audit,RealtimeService realtime,ObjectProvider<EmbeddedMqttBroker> broker,
            @Value("${app.mqtt.embedded.enabled:false}") boolean enabled,
            @Value("${app.mqtt.embedded.port:1883}") int port,
            @Value("${app.mqtt.embedded.advertised-host:}") String advertisedHost) {
        this.access=access;this.devices=devices;this.ownerships=ownerships;this.passwords=passwords;this.audit=audit;this.realtime=realtime;
        this.broker=broker;this.embeddedEnabled=enabled;this.port=port;this.advertisedHost=advertisedHost;
    }
    @Transactional public MqttCredentialResponse rotate(String id,User user,String sourceIp,String requestHost) {
        if(!embeddedEnabled) throw new BadRequestException("Chỉ cấp thông tin kết nối khi broker riêng đang bật");
        Device d=access.getDeviceEntityChecked(id,user,true);
        if(!"HARDWARE".equals(d.getDataSource())) throw new BadRequestException("Thiết bị mô phỏng không dùng mật khẩu MQTT");
        if(d.getLifecycleState()==LifecycleState.DECOMMISSIONED) throw new BadRequestException("Thiết bị đã ngừng sử dụng vĩnh viễn");
        if(d.getLifecycleState()==LifecycleState.FAULT) throw new BadRequestException("Thiết bị đã bị thu hồi; cần kích hoạt lại trước khi cấp mật khẩu");
        return issue(d,user,sourceIp,requestHost,"ROTATE_DEVICE_CREDENTIAL");
    }
    @Transactional public MqttCredentialResponse reactivate(String id,User user,String sourceIp,String requestHost) {
        if(!embeddedEnabled) throw new BadRequestException("Chỉ kích hoạt lại kết nối khi broker riêng đang bật");
        Device d=access.getDeviceEntityChecked(id,user,true);
        if(!"HARDWARE".equals(d.getDataSource())) throw new BadRequestException("Thiết bị mô phỏng không dùng mật khẩu MQTT");
        if(d.getLifecycleState()!=LifecycleState.FAULT) throw new BadRequestException("Chỉ kích hoạt lại thiết bị đã tạm thu hồi; thiết bị ngừng sử dụng là vĩnh viễn");
        if(ownerships.findByDevice(d).isEmpty()) {
            d.setLifecycleState(LifecycleState.PROVISIONED);
            d.setClaimToken("CLAIM-"+java.util.UUID.randomUUID());d.setClaimTokenExpiry(java.time.Instant.now().plusSeconds(7*86400));
        } else d.setLifecycleState(LifecycleState.OFFLINE);
        var response=issue(d,user,sourceIp,requestHost,"REACTIVATE_DEVICE");
        realtime.publish(d,"DEVICE",null);
        return response;
    }
    private MqttCredentialResponse issue(Device d,User user,String sourceIp,String requestHost,String action) {
        byte[] random=new byte[32];new SecureRandom().nextBytes(random);
        String secret=Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        String username="device-"+d.getDeviceUuid();
        d.setMqttUsername(username);d.setMqttPasswordHash(passwords.encode(secret));devices.save(d);
        audit.log(user,d,action,"SUCCESS","Cấp mới thông tin kết nối riêng của thiết bị",sourceIp);
        realtime.afterCommit(()->broker.ifAvailable(b->b.disconnectUsername(username)));
        return new MqttCredentialResponse(username,secret,advertisedHost.isBlank()?requestHost:advertisedHost,port,"mqtt",d.getDeviceUuid());
    }
}
