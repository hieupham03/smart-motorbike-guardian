package com.guardian.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="push_deliveries", uniqueConstraints=@UniqueConstraint(columnNames={"event_key","push_token_id"}))
public class PushDelivery {
    @Id @Column(name="delivery_id", length=36) private String deliveryId;
    @Column(name="event_key", nullable=false, length=255) private String eventKey;
    @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="push_token_id", nullable=false) private PushToken pushToken;
    @Column(nullable=false, length=30) private String status;
    @Column(name="ticket_id", length=255) private String ticketId;
    @Column(name="error_code", length=100) private String errorCode;
    @Column(name="created_at", nullable=false, updatable=false) private Instant createdAt=Instant.now();
    @Column(name="updated_at", nullable=false) private Instant updatedAt=Instant.now();
    public PushDelivery() {}
    public PushDelivery(String id,String key,PushToken token){deliveryId=id;eventKey=key;pushToken=token;status="PENDING";}
    @PreUpdate public void updateTimestamp(){updatedAt=Instant.now();}
    public String getDeliveryId(){return deliveryId;} public String getEventKey(){return eventKey;} public PushToken getPushToken(){return pushToken;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;} public String getTicketId(){return ticketId;} public void setTicketId(String v){ticketId=v;} public String getErrorCode(){return errorCode;} public void setErrorCode(String v){errorCode=v;} public Instant getUpdatedAt(){return updatedAt;}
}
