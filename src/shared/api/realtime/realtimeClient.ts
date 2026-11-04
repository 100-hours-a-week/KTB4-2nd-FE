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

/**
 * 로그인한 사용자의 웹소켓(STOMP) 연결을 열고, 재연결될 때마다 같은 구독을 다시 겁니다.
 * 반환한 함수를 호출하면 연결을 닫고 재연결도 멈춥니다.
 */
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
    // beforeConnect가 예외를 던지면 재연결이 멈추므로 실패는 여기서 처리합니다.
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
        // 세션이 끝났다면 재연결해도 계속 거절되므로 멈춥니다. 다른 실패는 다음 재연결에서 다시 시도합니다.
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

  // 네트워크가 돌아오거나 화면으로 돌아오면 재연결 대기 시간을 기다리지 않고 바로 연결합니다.
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
