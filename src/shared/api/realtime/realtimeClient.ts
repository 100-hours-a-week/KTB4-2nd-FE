'use client';

import { Client, ReconnectionTimeMode, type StompSubscription } from '@stomp/stompjs';
import { isAxiosError } from 'axios';

import { fetchCsrfToken, refreshSession } from '../browser';
import { getRealtimeUrl } from './config';
import { setRealtimeStatus } from './realtimeStatus';

export type RealtimeSubscription = {
  destination: string;
  onMessage: (body: unknown) => void;
  onRejected?: () => void;
};

type SubscriptionEntry = RealtimeSubscription & {
  stomp?: StompSubscription;
  subscribedAt?: number;
  quickCloses: number;
};

const RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const HEARTBEAT_MS = 10_000;
const CONNECTION_TIMEOUT_MS = 10_000;
const REJECTION_WINDOW_MS = 3_000;
const REJECTION_LIMIT = 2;

const entries = new Set<SubscriptionEntry>();
let activeClient: Client | null = null;

function parseBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function subscribeEntry(client: Client, entry: SubscriptionEntry) {
  entry.stomp = client.subscribe(entry.destination, (message) =>
    entry.onMessage(parseBody(message.body)),
  );
  entry.subscribedAt = Date.now();
}

function releaseEntriesOnClose() {
  const now = Date.now();
  entries.forEach((entry) => {
    const subscribedAt = entry.subscribedAt;
    entry.stomp = undefined;
    entry.subscribedAt = undefined;
    if (!entry.onRejected || subscribedAt === undefined) return;

    entry.quickCloses = now - subscribedAt < REJECTION_WINDOW_MS ? entry.quickCloses + 1 : 0;
    if (entry.quickCloses < REJECTION_LIMIT) return;
    entries.delete(entry);
    entry.onRejected();
  });
}

function addEntry(subscription: RealtimeSubscription) {
  const entry: SubscriptionEntry = { ...subscription, quickCloses: 0 };
  entries.add(entry);
  if (activeClient?.connected) subscribeEntry(activeClient, entry);

  return () => {
    entries.delete(entry);
    if (activeClient?.connected && entry.stomp) entry.stomp.unsubscribe();
    entry.stomp = undefined;
  };
}

/** 연결 여부와 상관없이 구독을 등록합니다. 연결되거나 재연결될 때마다 다시 구독합니다. */
export function subscribeRealtime(subscription: RealtimeSubscription) {
  return addEntry(subscription);
}

export function connectRealtime(subscriptions: RealtimeSubscription[]) {
  let stopped = false;
  let connectedThisAttempt = false;
  let shouldRefreshSession = false;
  let refreshedSinceConnected = false;
  const removeSubscriptions = subscriptions.map(addEntry);

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
      entries.forEach((entry) => subscribeEntry(client, entry));
      setRealtimeStatus('connected');
    },
    onWebSocketClose: () => {
      if (stopped) return;
      if (connectedThisAttempt) connectedThisAttempt = false;
      else if (!refreshedSinceConnected) shouldRefreshSession = true;
      releaseEntriesOnClose();
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
    removeSubscriptions.forEach((remove) => remove());
    if (activeClient === client) activeClient = null;
    entries.forEach((entry) => {
      entry.stomp = undefined;
      entry.subscribedAt = undefined;
    });
    void client.deactivate();
    setRealtimeStatus('disconnected');
  }

  activeClient = client;
  window.addEventListener('online', reconnectNow);
  document.addEventListener('visibilitychange', reconnectNow);
  client.activate();

  return stop;
}
