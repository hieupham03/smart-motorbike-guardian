package com.guardian.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Component
public class ExpoPushTransport implements PushTransport {
 private final RestClient client;
 public ExpoPushTransport(RestClient.Builder builder,@Value("${app.push.base-url:https://exp.host}") String baseUrl,@Value("${app.push.access-token:}") String accessToken){
  RestClient.Builder configured=builder.baseUrl(baseUrl).defaultHeader("Accept","application/json").defaultHeader("Accept-Encoding","gzip, deflate");
  if(accessToken!=null&&!accessToken.isBlank()) configured.defaultHeader("Authorization","Bearer "+accessToken);
  client=configured.build();
 }
 @Override public Result send(String token,String title,String body,Map<String,Object> data){
  JsonNode root=client.post().uri("/--/api/v2/push/send").contentType(MediaType.APPLICATION_JSON).body(Map.of("to",token,"sound","default","title",title,"body",body,"data",data)).retrieve().body(JsonNode.class);
  JsonNode item=root==null?null:root.path("data"); if(item!=null&&item.isArray()) item=item.path(0);
  if(item!=null&&"ok".equals(item.path("status").asText())) return new Result(item.path("id").asText(null),null);
  return new Result(null,item==null?"EMPTY_RESPONSE":item.path("details").path("error").asText("PUSH_REJECTED"));
 }
 @Override public Result receipt(String ticketId){
  JsonNode root=client.post().uri("/--/api/v2/push/getReceipts").contentType(MediaType.APPLICATION_JSON).body(Map.of("ids",new String[]{ticketId})).retrieve().body(JsonNode.class);
  JsonNode item=root==null?null:root.path("data").path(ticketId);
  if(item==null||item.isMissingNode()) return new Result(ticketId,"PENDING_RECEIPT");
  if("ok".equals(item.path("status").asText())) return new Result(ticketId,null);
  return new Result(null,item.path("details").path("error").asText("DELIVERY_ERROR"));
 }
}
