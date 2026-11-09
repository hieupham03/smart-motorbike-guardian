import { apiClient, type GuardianApiClient } from "./client";
import type {
  Device,
  DeviceConfigRequest,
  OnboardRequest,
  Telemetry,
  User,
  WheelSession,
} from "@/types/api";

export interface DeviceMqttCredentials {
  username: string;
  password: string;
  brokerHost: string;
  brokerPort: number;
  deviceUuid: string;
}

export function createDevicesApi(client: GuardianApiClient = apiClient) {
  return {
    list: () =>
      client.request<Device[]>({ url: "/api/devices", method: "GET" }),
    detail: (deviceId: string) =>
      client.request<Device>({
        url: `/api/devices/${deviceId}`,
        method: "GET",
      }),
    rotateCredentials: (deviceId: string) =>
      client.request<DeviceMqttCredentials>({ url: `/api/devices/${deviceId}/mqtt-credentials`, method: "POST" }),
    reactivate: (deviceId: string) =>
      client.request<DeviceMqttCredentials>({ url: `/api/devices/${deviceId}/reactivate`, method: "POST" }),
    latestTelemetry: (deviceId: string) =>
      client.request<Telemetry | null>({
        url: `/api/devices/${deviceId}/telemetry/latest`,
        method: "GET",
      }),
    wheelSession: (deviceId: string) =>
      client.request<WheelSession | null>({
        url: `/api/devices/${deviceId}/wheel-session`,
        method: "GET",
      }),
    telemetryHistory: (
      deviceId: string,
      from: number,
      to: number,
      page = 0,
      size = 300,
    ) =>
      client.request<Telemetry[]>({
        url: `/api/devices/${deviceId}/telemetry`,
        method: "GET",
        params: { from, to, page, size },
      }),
    onboard: (payload: OnboardRequest) =>
      client.request<Device>({
        url: "/api/devices/onboard",
        method: "POST",
        data: payload,
      }),
    updateConfig: (deviceId: string, payload: DeviceConfigRequest) =>
      client.request<Device>({
        url: `/api/devices/${deviceId}/config`,
        method: "PATCH",
        data: payload,
      }),
    users: (deviceId: string) =>
      client.request<User[]>({
        url: `/api/devices/${deviceId}/users`,
        method: "GET",
      }),
    inviteViewer: (deviceId: string, email: string) =>
      client.request<null>({
        url: `/api/devices/${deviceId}/users`,
        method: "POST",
        data: { email, role: "VIEWER" },
      }),
    removeUser: (deviceId: string, userId: string) =>
      client.request<null>({
        url: `/api/devices/${deviceId}/users/${userId}`,
        method: "DELETE",
      }),
    simulate: (
      deviceId: string,
      action: "SET_SPEED" | "TRIGGER_FALL" | "TRIGGER_THEFT_TAMPER",
      value: number | null = null,
    ) =>
      client.request<unknown>({
        url: "/api/simulator/action",
        method: "POST",
        data: { deviceId, action, value },
      }),
  };
}

export const devicesApi = createDevicesApi();
