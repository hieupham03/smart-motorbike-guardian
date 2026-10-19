package com.guardian.service;
import java.util.Map;
public interface PushTransport {
 record Result(String ticketId,String errorCode) { public boolean accepted(){return ticketId!=null;} }
 Result send(String token,String title,String body,Map<String,Object> data);
 Result receipt(String ticketId);
}
