package com.guardian.config;

import com.guardian.entity.User;
import com.guardian.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.*;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtTokenProvider tokens;
    private final UserRepository users;
    private record SessionAuth(String email, java.time.Instant expiresAt) {}
    private final java.util.concurrent.ConcurrentMap<String, SessionAuth> sessions = new java.util.concurrent.ConcurrentHashMap<>();
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}") private String origins;
    public WebSocketConfig(JwtTokenProvider tokens, UserRepository users) { this.tokens = tokens; this.users = users; }

    @Override public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/queue").setHeartbeatValue(new long[]{10000, 10000}).setTaskScheduler(heartbeatScheduler());
        config.setApplicationDestinationPrefixes("/app");
        config.setPreservePublishOrder(true);
    }

    @org.springframework.context.annotation.Bean
    public ThreadPoolTaskScheduler heartbeatScheduler() {
        var scheduler = new ThreadPoolTaskScheduler();
        scheduler.setThreadNamePrefix("ws-heartbeat-"); scheduler.setDaemon(true);
        return scheduler;
    }

    @Override public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins(origins.split(","));
    }

    @Override public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override public Message<?> preSend(Message<?> message, MessageChannel channel) {
                var h = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (h == null || h.getCommand() == null) return message;
                if (h.getCommand() == StompCommand.CONNECT) {
                    String auth = h.getFirstNativeHeader("Authorization");
                    if (auth == null || !auth.startsWith("Bearer ") || !tokens.validateToken(auth.substring(7), "ACCESS"))
                        throw new AccessDeniedException("ACCESS token required");
                    User user = users.findByEmail(tokens.extractEmail(auth.substring(7)))
                            .filter(u -> "ACTIVE".equals(u.getStatus())).orElseThrow(() -> new AccessDeniedException("Inactive user"));
                    h.setUser(new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of()));
                    sessions.put(h.getSessionId(), new SessionAuth(user.getEmail(), tokens.extractClaim(auth.substring(7), io.jsonwebtoken.Claims::getExpiration).toInstant()));
                } else if (h.getCommand() != StompCommand.DISCONNECT) {
                    SessionAuth session = sessions.get(h.getSessionId());
                    if (h.getUser() == null || session == null || !session.expiresAt().isAfter(java.time.Instant.now())) throw new AccessDeniedException("Unauthenticated session");
                    if (h.getCommand() == StompCommand.SUBSCRIBE && !"/user/queue/events".equals(h.getDestination()))
                        throw new AccessDeniedException("Only the authorized user event queue is allowed");
                    if (h.getCommand() == StompCommand.SEND) throw new AccessDeniedException("Use the authorized REST command API");
                }
                return message;
            }
        });
    }

    @Override public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override public Message<?> preSend(Message<?> message, MessageChannel channel) {
                var h = org.springframework.messaging.simp.SimpMessageHeaderAccessor.wrap(message);
                if (h.getMessageType() == org.springframework.messaging.simp.SimpMessageType.MESSAGE) {
                    SessionAuth session = sessions.get(h.getSessionId());
                    if (session == null || !session.expiresAt().isAfter(java.time.Instant.now())) return null;
                }
                return message;
            }
        });
    }

    @org.springframework.context.event.EventListener
    public void disconnected(org.springframework.web.socket.messaging.SessionDisconnectEvent event) {
        sessions.remove(event.getSessionId());
    }
}
