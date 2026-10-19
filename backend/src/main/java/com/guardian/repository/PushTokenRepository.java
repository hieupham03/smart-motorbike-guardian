package com.guardian.repository;
import com.guardian.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PushTokenRepository extends JpaRepository<PushToken,String>{
 Optional<PushToken> findByExpoToken(String token); Optional<PushToken> findByUserAndInstallationId(User user,String installationId);
 List<PushToken> findByUserInAndActiveTrue(Collection<User> users);
}
