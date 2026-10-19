package com.guardian.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
public class PushTokenRequest {
 @NotBlank @Pattern(regexp="ExponentPushToken\\[[^\\]]+\\]|ExpoPushToken\\[[^\\]]+\\]",message="Expo push token không hợp lệ") private String token;
 @NotBlank @Pattern(regexp="android|ios",flags=Pattern.Flag.CASE_INSENSITIVE) private String platform;
 @NotBlank private String installationId;
 public String getToken(){return token;} public void setToken(String v){token=v;} public String getPlatform(){return platform;} public void setPlatform(String v){platform=v;} public String getInstallationId(){return installationId;} public void setInstallationId(String v){installationId=v;}
}
