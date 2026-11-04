'use client';

import { Client, ReconnectionTimeMode } from '@stomp/stompjs';
import { isAxiosError } from 'axios';

import { fetchCsrfToken, refreshSession } from '../browser';
import { getRealtimeUrl } from './config';
import { setRealtimeStatus } from './realtimeStatus';

export type RealtimeSubscription = {
  destination: string;
  onMessage: (body: unknown) => void;
};

const RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const HEARTBEAT_MS = 10_000;
const CONNECTION_TIMEOUT_MS = 10_000;

function parseBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

export function connectRealtime(subscriptions: RealtimeSubscription[]) {
  let stopped = false;
  let connectedThisAttempt = false;
  let shouldRefreshSession = false;
  let refreshedSinceConnected = false;

  const client = new Client({
    brokerURL: getRealtimeUrl(),
    reconnectDelay: RECONNECT_DELAY_MS,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: MAX_RECONNECT_DELAY_MS,
    heartbeatIncoming: HEARTBEAT_MS,
    heartbeatOutgoing: HEARTBEAT_MS,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    beforeConnect: async (stomp) => {
      if (stopped) return;
      connectedThisAttempt = false;
      setRealtimeStatus('connecting');
      try {
        // 직전 연결이 거절됐다면 accessToken 만료일 수 있어, 다시 연결될 때까지 한 번만 세션을 갱신합니다.
        if (shouldRefreshSession) {
          shouldRefreshSession = false;
          refreshedSinceConnected = true;
          await refreshSession();
        }
        stomp.connectHeaders = { 'X-CSRF-TOKEN': await fetchCsrfToken() };
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          stop();
        }
      }
    },
    onConnect: () => {
      if (stopped) return;
      connectedThisAttempt = true;
      refreshedSinceConnected = false;
      subscriptions.forEach(({ destination, onMessage }) => {
        client.subscribe(destination, (message) => onMessage(parseBody(message.body)));
      });
      setRealtimeStatus('connected');
    },
    onWebSocketClose: () => {
      if (stopped) return;
      if (connectedThisAttempt) connectedThisAttempt = false;
      else if (!refreshedSinceConnected) shouldRefreshSession = true;
      setRealtimeStatus('disconnected');
    },
  });

  function reconnectNow() {
    if (stopped || client.connected || client.webSocket || document.visibilityState === 'hidden')
      return;
    void client.deactivate().then(() => {
      if (!stopped) client.activate();
    });
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    window.removeEventListener('online', reconnectNow);
    document.removeEventListener('visibilitychange', reconnectNow);
    void client.deactivate();
    setRealtimeStatus('disconnected');
  }

  window.addEventListener('online', reconnectNow);
  document.addEventListener('visibilitychange', reconnectNow);
  client.activate();

  return stop;
}
