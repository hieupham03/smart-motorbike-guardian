package com.guardian.controller;
import com.guardian.dto.*; import com.guardian.entity.User; import com.guardian.service.PushNotificationService;
import jakarta.validation.Valid; import org.springframework.http.ResponseEntity; import org.springframework.security.core.annotation.AuthenticationPrincipal; import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/push-tokens")
public class PushTokenController {
 private final PushNotificationService push; public PushTokenController(PushNotificationService p){push=p;}
 @PostMapping public ResponseEntity<ApiResponse<Map<String,String>>> register(@AuthenticationPrincipal User user,@Valid @RequestBody PushTokenRequest request){push.register(user,request.getToken(),request.getPlatform(),request.getInstallationId());return ResponseEntity.ok(ApiResponse.ok(Map.of("status","REGISTERED")));}
 @DeleteMapping("/{installationId}") public ResponseEntity<ApiResponse<Map<String,String>>> unregister(@AuthenticationPrincipal User user,@PathVariable String installationId){push.unregister(user,installationId);return ResponseEntity.ok(ApiResponse.ok(Map.of("status","UNREGISTERED")));}
}
