package com.guardian.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ownership", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "device_id"})
})
public class Ownership {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Role role = Role.OWNER; // OWNER or VIEWER

    @Column(name = "granted_at", nullable = false, updatable = false)
    private Instant grantedAt = Instant.now();

    public Ownership() {}

    public Ownership(String id, User user, Device device, Role role) {
        this.id = id;
        this.user = user;
        this.device = device;
        this.role = role;
        this.grantedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Instant getGrantedAt() { return grantedAt; }
    public void setGrantedAt(Instant grantedAt) { this.grantedAt = grantedAt; }
}
