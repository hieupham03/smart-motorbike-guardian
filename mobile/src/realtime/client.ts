import { Client } from '@stomp/stompjs';

import { apiClient, type GuardianApiClient } from '@/api/client';
import { env } from '@/config/env';
import { tokenStore, type TokenStore } from '@/storage/tokenStore';
import type { RealtimeEvent } from './types';

export type RealtimeStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

interface ConnectOptions {
  onEvent(event: RealtimeEvent): void;
  onStatus(status: RealtimeStatus): void;
  onConnected(): void;
  client?: GuardianApiClient;
  store?: TokenStore;
  url?: string;
}

export function connectRealtime({ onEvent, onStatus, onConnected, client = apiClient, store = tokenStore, url = env.wsUrl }: ConnectOptions) {
  let renewalTimer: ReturnType<typeof setTimeout> | undefined;
  const stomp = new Client({
    brokerURL: url,
    reconnectDelay: 2_000,
    connectionTimeout: 8_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    discardWebsocketOnCommFailure: true,
    beforeConnect: async () => {
      onStatus('CONNECTING');
      const accessToken = await client.ensureAccessToken();
      stomp.connectHeaders = { Authorization: `Bearer ${accessToken}` };
    },
    onConnect: () => {
      stomp.subscribe('/user/queue/events', (message) => {
        try { onEvent(JSON.parse(message.body) as RealtimeEvent); }
        catch { onStatus('ERROR'); }
      });
      onStatus('CONNECTED');
      onConnected();
      const expiresAt = store.getSession()?.accessExpiresAtMs;
      if (expiresAt) {
        clearTimeout(renewalTimer);
        renewalTimer = setTimeout(() => stomp.forceDisconnect(), Math.max(1_000, expiresAt - Date.now() - 30_000));
      }
    },
    onWebSocketClose: () => onStatus('DISCONNECTED'),
    onStompError: () => onStatus('ERROR'),
    onWebSocketError: () => onStatus('ERROR'),
  });
  stomp.activate();
  return () => {
    clearTimeout(renewalTimer);
    void stomp.deactivate();
  };
}
