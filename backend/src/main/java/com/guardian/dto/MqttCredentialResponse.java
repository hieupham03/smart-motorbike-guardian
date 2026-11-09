package com.guardian.dto;

/** Password is returned only by an explicit owner/admin rotation, never in device snapshots. */
public record MqttCredentialResponse(String username,String password,String brokerHost,int brokerPort,String protocol,String deviceUuid) {}
