import { Client } from '@stomp/stompjs';
import { ensureAccessToken } from './api';

export function connectRealtime({ onEvent, onStatus, onConnected }) {
  let renewal;
  const url = new URL(import.meta.env.VITE_WS_URL || '/ws', window.location.href);
  url.protocol = url.protocol === 'https:' || url.protocol === 'wss:' ? 'wss:' : 'ws:';
  const client = new Client({
    brokerURL: url.href,
    reconnectDelay: 2000,
    connectionTimeout: 8000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    discardWebsocketOnCommFailure: true,
    beforeConnect: async () => {
      onStatus('CONNECTING');
      try {
        const token = await ensureAccessToken();
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      } catch (error) {
        onStatus('ERROR');
        if ([401, 403].includes(error.status)) {
          ['accessToken', 'refreshToken', 'currentUser'].forEach(key => localStorage.removeItem(key));
          window.dispatchEvent(new Event('guardian:logout'));
          await client.deactivate();
        } else {
          // A temporary network outage must preserve the refresh token for the next reconnect.
          client.connectHeaders = { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` };
        }
      }
    },
    onConnect: () => {
      client.subscribe('/user/queue/events', message => {
        try { onEvent(JSON.parse(message.body)); } catch { onStatus('ERROR'); }
      });
      onStatus('CONNECTED');
      onConnected();
      // Reauthenticate before token expiry; reconnect uses the latest token.
      try {
        const token = localStorage.getItem('accessToken');
        const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        clearTimeout(renewal);
        renewal = setTimeout(() => client.forceDisconnect(), Math.max(1000, exp * 1000 - Date.now() - 30000));
      } catch { /* server still validates the token */ }
    },
    onWebSocketClose: () => onStatus('DISCONNECTED'),
    onStompError: () => onStatus('ERROR'),
    onWebSocketError: () => onStatus('ERROR'),
  });
  client.activate();
  return () => { clearTimeout(renewal); void client.deactivate(); };
}
