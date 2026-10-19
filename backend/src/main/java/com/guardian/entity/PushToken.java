package com.guardian.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "push_tokens")
public class PushToken {
    @Id @Column(name = "push_token_id", length = 36) private String pushTokenId;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "expo_token", nullable = false, unique = true, length = 255) private String expoToken;
    @Column(nullable = false, length = 20) private String platform;
    @Column(name = "installation_id", nullable = false, length = 255) private String installationId;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
    public PushToken() {}
    public PushToken(String id, User user, String token, String platform, String installationId) { this.pushTokenId=id; this.user=user; this.expoToken=token; this.platform=platform; this.installationId=installationId; }
    @PreUpdate public void updateTimestamp() { updatedAt = Instant.now(); }
    public String getPushTokenId(){return pushTokenId;} public User getUser(){return user;} public void setUser(User v){user=v;}
    public String getExpoToken(){return expoToken;} public void setExpoToken(String v){expoToken=v;} public String getPlatform(){return platform;} public void setPlatform(String v){platform=v;}
    public String getInstallationId(){return installationId;} public void setInstallationId(String v){installationId=v;} public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
}
