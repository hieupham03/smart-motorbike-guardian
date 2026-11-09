package com.guardian.config;

import com.guardian.service.MqttDeviceSecurityService;
import io.moquette.broker.Server;
import io.moquette.broker.config.MemoryConfig;
import io.moquette.broker.security.IAuthorizatorPolicy;
import io.moquette.broker.subscriptions.Topic;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

/** Actual MQTT broker for a private classroom LAN, not a sensor simulator. */
@Component
@ConditionalOnProperty(name="app.mqtt.embedded.enabled",havingValue="true")
public class EmbeddedMqttBroker {
    private final MqttDeviceSecurityService security;
    private final ConcurrentHashMap<String,String> authenticated=new ConcurrentHashMap<>();
    private final String host;
    private final int port;
    private Server server;
    public EmbeddedMqttBroker(MqttDeviceSecurityService security,
            @Value("${app.mqtt.embedded.host:0.0.0.0}") String host, @Value("${app.mqtt.embedded.port:1883}") int port) {
        this.security=security; this.host=host; this.port=port;
    }
    @PostConstruct public void start() throws IOException {
        if (!security.serviceCredentialsConfigured()) throw new IllegalStateException("Embedded MQTT requires a separate service username and password of at least 16 characters");
        Properties p=new Properties();
        p.setProperty("host",host); p.setProperty("port",String.valueOf(port));
        p.setProperty("allow_anonymous","false"); p.setProperty("persistence_enabled","false");
        p.setProperty("telemetry_enabled","false"); // Keep classroom operation local; no library analytics.
        p.setProperty("netty_epoll","false"); p.setProperty("netty.mqtt.message_size","8192");
        server=new Server();
        server.startServer(new MemoryConfig(p),List.of(),null,(client,user,password)->{
            try {
                boolean valid=security.authenticate(client,user,password);
                if(valid && client.startsWith("Guardian-")) authenticated.put(client,user);
                return valid;
            } catch (RuntimeException unavailable) { return false; } // Database failures fail closed.
        },new IAuthorizatorPolicy() {
            @Override public boolean canWrite(Topic topic,String user,String client) {
                try { return security.canWrite(topic.toString(),user,client); } catch(RuntimeException unavailable) {return false;}
            }
            @Override public boolean canRead(Topic topic,String user,String client) {
                try { return security.canRead(topic.toString(),user,client); } catch(RuntimeException unavailable) {return false;}
            }
        });
    }
    public void disconnectUsername(String username) {
        if(server==null || username==null) return;
        authenticated.forEach((client,user)->{
            if(username.equals(user)) { server.disconnectAndPurgeClientState(client); authenticated.remove(client,user); }
        });
    }
    public int port() { return port; }
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay=1000)
    public void expireRevokedSessions() {
        authenticated.forEach((client,user)->{
            try {
                String uuid=client.substring("Guardian-".length());
                if(!security.canRead("guardian/"+uuid+"/cmd/#",user,client)) disconnectUsername(user);
            } catch(RuntimeException unavailable) {disconnectUsername(user);}
        });
    }
    @PreDestroy public void stop() { if(server!=null) server.stopServer(); }
}
