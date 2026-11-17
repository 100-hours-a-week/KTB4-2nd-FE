import { isAxiosError } from 'axios';

import { apiClient } from '../browser/apiClient';
import { refreshSession } from '../browser/refreshSession';
import type { ApiResponse } from '../types';
import { connectRealtime, publishRealtime, subscribeRealtime } from './realtimeDirect';
import { recordRealtime } from './realtimeMeasurement';
import { getRealtimeStatus, subscribeRealtimeStatus } from './realtimeStatus';
import {
  PORT_LEASE_MS,
  PORT_PING_MS,
  REALTIME_EXPERIMENT_SESSION_CHANNEL,
  type TabMessage,
  type WorkerMessage,
  type WorkerSubscription,
} from './realtimeWorkerProtocol';

type Peer = { port: MessagePort; expires: number; subscriptions: Map<number, Group> };
type Group = {
  key: string;
  subscriptions: Map<Peer, Map<number, WorkerSubscription>>;
  remove: () => void;
  subscribed: boolean;
  presence?: WorkerSubscription['presence'];
  snapshot?: unknown;
  heartbeat?: ReturnType<typeof setInterval>;
};

const peers = new Set<Peer>();
const groups = new Map<string, Group>();
let config: { url: string; userId: number } | undefined;
let stop: ReturnType<typeof connectRealtime> | undefined;
let closing: Promise<void> | undefined;
let invalidated = false;

function send(peer: Peer, message: WorkerMessage) {
  peer.port.postMessage(message);
}

function recordCounts() {
  recordRealtime('shared', 'worker-counts', {
    ports: peers.size,
    subscriptions: groups.size,
    listeners: [...peers].reduce((count, peer) => count + peer.subscriptions.size, 0),
  });
}

function forEachListener(
  group: Group,
  callback: (peer: Peer, id: number, subscription: WorkerSubscription) => void,
) {
  group.subscriptions.forEach((listeners, peer) =>
    listeners.forEach((subscription, id) => callback(peer, id, subscription)),
  );
}

function unsubscribe(peer: Peer, id: number) {
  const group = peer.subscriptions.get(id);
  if (!group) return;
  peer.subscriptions.delete(id);
  const listeners = group.subscriptions.get(peer);
  listeners?.delete(id);
  if (listeners?.size === 0) group.subscriptions.delete(peer);
  if (group.subscriptions.size === 0) {
    clearInterval(group.heartbeat);
    if (group.subscribed && group.presence) publishRealtime(group.presence.leave);
    group.remove();
    groups.delete(group.key);
  }
  recordCounts();
}

function subscribe(peer: Peer, id: number, subscription: WorkerSubscription) {
  if (peer.subscriptions.has(id)) return;
  const { destination, presence, rejectable } = subscription;
  const key = `${destination}:${rejectable}`;
  const existing = groups.get(key);
  const group: Group = existing ?? {
    key,
    subscriptions: new Map(),
    remove: () => {},
    subscribed: false,
    presence,
  };
  groups.set(key, group);
  peer.subscriptions.set(id, group);
  const listeners = group.subscriptions.get(peer) ?? new Map();
  listeners.set(id, subscription);
  group.subscriptions.set(peer, listeners);

  if (existing) {
    if (group.subscribed) send(peer, { type: 'subscribed', id });
    if (group.snapshot !== undefined) send(peer, { type: 'message', id, body: group.snapshot });
  } else {
    group.remove = subscribeRealtime({
      destination,
      onMessage: (body) => {
        if (presence) group.snapshot = body;
        forEachListener(group, (target, id, listener) => {
          if (listener.requestId) {
            const result = body as { data?: { requestId?: unknown } } | null | undefined;
            if (result?.data?.requestId !== listener.requestId) return;
          }
          send(target, { type: 'message', id, body });
        });
      },
      onSubscribed: () => {
        group.subscribed = true;
        if (presence) {
          publishRealtime(presence.join);
          group.heartbeat = setInterval(
            () => publishRealtime(presence.heartbeat),
            presence.intervalMs,
          );
        }
        forEachListener(group, (target, id) => send(target, { type: 'subscribed', id }));
      },
      onRejected: rejectable
        ? () => {
            group.subscribed = false;
            forEachListener(group, (target, id) => {
              target.subscriptions.delete(id);
              send(target, { type: 'rejected', id });
            });
            clearInterval(group.heartbeat);
            groups.delete(key);
            recordCounts();
          }
        : undefined,
    });
  }
  recordCounts();
}

function detach(peer: Peer) {
  if (!peers.delete(peer)) return;
  peer.subscriptions.forEach((_, id) => unsubscribe(peer, id));
  peer.port.close();
  if (peers.size === 0) {
    closing = stop?.();
    stop = undefined;
  }
  recordCounts();
}

function invalidate() {
  invalidated = true;
  peers.forEach((peer) => {
    send(peer, { type: 'unauthorized' });
    detach(peer);
  });
}

async function verifySession(userId: number) {
  function currentUser() {
    return apiClient.get<ApiResponse<{ userId: number }>>('/users/me', {
      skipAuthRefresh: true,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const { data } = await currentUser().catch(async (error: unknown) => {
    if (!isAxiosError(error) || error.response?.status !== 401) throw error;
    await refreshSession();
    return currentUser();
  });
  return data.data?.userId === userId;
}

async function start() {
  await closing;
  if (!config || stop || peers.size === 0 || invalidated) return;
  const { userId, url } = config;
  stop = connectRealtime([], {
    url,
    measurement: 'shared',
    verifySession: () => verifySession(userId),
    onUnauthorized: invalidate,
  });
}

subscribeRealtimeStatus(() => {
  const status = getRealtimeStatus();
  if (status !== 'connected') {
    groups.forEach((group) => {
      group.subscribed = false;
      group.snapshot = undefined;
      clearInterval(group.heartbeat);
    });
  }
  peers.forEach((peer) => send(peer, { type: 'status', status }));
});

const session = new BroadcastChannel(REALTIME_EXPERIMENT_SESSION_CHANNEL);
session.onmessage = ({ data }) => {
  if (data !== 'logout') return;
  // 이 워커를 이미 사용하던 탭들만 종료합니다. 새 로그인은 다시 연결할 수 있습니다.
  invalidate();
  invalidated = false;
};

const scope = self as unknown as { onconnect: (event: MessageEvent) => void };
scope.onconnect = ({ ports: [port] }) => {
  const peer: Peer = { port, expires: Date.now() + PORT_LEASE_MS, subscriptions: new Map() };
  let attached = false;
  const pending = setTimeout(() => port.close(), PORT_PING_MS);
  port.onmessage = ({ data }: MessageEvent<TabMessage>) => {
    if (data.type === 'attach' && !attached) {
      clearTimeout(pending);
      if (invalidated || (config && (config.userId !== data.userId || config.url !== data.url))) {
        send(peer, { type: 'unauthorized' });
        port.close();
        return;
      }
      config = { url: data.url, userId: data.userId };
      attached = true;
      peers.add(peer);
      send(peer, { type: 'ready' });
      send(peer, { type: 'status', status: getRealtimeStatus() });
      recordCounts();
      void start();
      return;
    }
    if (!peers.has(peer)) return;
    peer.expires = Date.now() + PORT_LEASE_MS;
    if (data.type === 'subscribe') subscribe(peer, data.id, data.subscription);
    else if (data.type === 'unsubscribe') unsubscribe(peer, data.id);
    else if (data.type === 'publish') publishRealtime(data.destination, data.body);
    else if (data.type === 'detach') detach(peer);
  };
  port.addEventListener('close', () => {
    clearTimeout(pending);
    detach(peer);
  });
};

setInterval(() => {
  const now = Date.now();
  peers.forEach((peer) => {
    if (peer.expires > now) return;
    send(peer, { type: 'expired' });
    detach(peer);
  });
}, PORT_PING_MS);
