import { Client, ReconnectionTimeMode, type StompSubscription } from '@stomp/stompjs';
import { isAxiosError } from 'axios';

import { fetchCsrfToken, refreshSession } from '../browser';
import { getRealtimeUrl } from './config';
import { measuredSocket } from './realtimeMeasurement';
import { setRealtimeStatus } from './realtimeStatus';

export type RealtimeSubscription = {
  destination: string;
  onMessage: (body: unknown) => void;
  /** 처음 구독할 때와 재연결 뒤 다시 구독할 때마다 불립니다. */
  onSubscribed?: (presenceManaged?: boolean) => void;
  requestId?: string;
  presence?: { join: string; heartbeat: string; leave: string; intervalMs: number };
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
  entry.onSubscribed?.();
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

export function subscribeRealtime(subscription: RealtimeSubscription) {
  return addEntry(subscription);
}

/** 연결되어 있을 때만 보내고, 보냈는지 돌려줍니다. 본문이 없으면 빈 프레임을 보냅니다. */
export function publishRealtime(destination: string, body?: unknown) {
  if (!activeClient?.connected) return false;
  activeClient.publish(
    body === undefined
      ? { destination }
      : {
          destination,
          body: JSON.stringify(body),
          headers: { 'content-type': 'application/json' },
        },
  );
  return true;
}

export function connectRealtime(
  subscriptions: RealtimeSubscription[],
  options?: {
    url?: string;
    measurement?: string;
    verifySession?: () => Promise<boolean>;
    onUnauthorized?: () => void;
  },
) {
  let stopped = false;
  let authRetry: ReturnType<typeof setTimeout> | undefined;
  let closing: Promise<void> | undefined;
  let connectedThisAttempt = false;
  let shouldRefreshSession = false;
  let refreshedSinceConnected = false;
  const removeSubscriptions = subscriptions.map(addEntry);

  const url = options?.url ?? getRealtimeUrl();
  const measurement = options?.measurement;
  const client = new Client({
    brokerURL: url,
    ...(measurement && {
      webSocketFactory: () =>
        measuredSocket(url, client.stompVersions.protocolVersions(), measurement),
    }),
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
        if (stopped) return;
        if (options?.verifySession && !(await options.verifySession())) {
          if (stopped) return;
          stop();
          options.onUnauthorized?.();
          return;
        }
        if (stopped) return;
        stomp.connectHeaders = { 'X-CSRF-TOKEN': await fetchCsrfToken() };
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          stop();
          options?.onUnauthorized?.();
        } else if (options?.verifySession) {
          if (stopped) return;
          setRealtimeStatus('disconnected');
          void client.deactivate().then(() => {
            if (!stopped) authRetry = setTimeout(() => client.activate(), MAX_RECONNECT_DELAY_MS);
          });
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
    if (stopped) return closing;
    stopped = true;
    clearTimeout(authRetry);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', reconnectNow);
      document.removeEventListener('visibilitychange', reconnectNow);
    }
    removeSubscriptions.forEach((remove) => remove());
    if (activeClient === client) activeClient = null;
    entries.forEach((entry) => {
      entry.stomp = undefined;
      entry.subscribedAt = undefined;
    });
    closing = client.deactivate();
    setRealtimeStatus('disconnected');
    return closing;
  }

  activeClient = client;
  if (typeof window !== 'undefined') {
    window.addEventListener('online', reconnectNow);
    document.addEventListener('visibilitychange', reconnectNow);
  }
  client.activate();

  return stop;
}
