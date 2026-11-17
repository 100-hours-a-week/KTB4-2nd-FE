import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RealtimeSubscription } from './realtimeDirect';
import { PORT_LEASE_MS, type TabMessage, type WorkerMessage } from './realtimeWorkerProtocol';

const { connect, publish, subscribe, getStatus, watchStatus, record } = vi.hoisted(() => ({
  connect: vi.fn(),
  publish: vi.fn(),
  subscribe: vi.fn(),
  getStatus: vi.fn(),
  watchStatus: vi.fn(),
  record: vi.fn(),
}));

vi.mock('./realtimeDirect', () => ({
  connectRealtime: connect,
  publishRealtime: publish,
  subscribeRealtime: subscribe,
}));
vi.mock('./realtimeStatus', () => ({
  getRealtimeStatus: getStatus,
  subscribeRealtimeStatus: watchStatus,
}));
vi.mock('./realtimeMeasurement', () => ({ recordRealtime: record }));

class TestPort extends EventTarget {
  messages: WorkerMessage[] = [];
  onmessage?: (event: MessageEvent<TabMessage>) => void;
  postMessage(message: WorkerMessage) {
    this.messages.push(message);
  }
  receive(data: TabMessage) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
  close = vi.fn();
}

const presence = { join: 'join', leave: 'leave', heartbeat: 'heartbeat', intervalMs: 15_000 };

function attach(userId = 7) {
  const port = new TestPort();
  (self as unknown as { onconnect: (event: { ports: TestPort[] }) => void }).onconnect({
    ports: [port],
  });
  port.receive({ type: 'attach', url: 'ws://localhost/api/ws', userId });
  return port;
}

function subscribeToPresence(port: TestPort) {
  port.receive({
    type: 'subscribe',
    id: 1,
    subscription: { destination: '/topic/trips/1/presence', rejectable: true, presence },
  });
}

describe('SharedWorker realtime hub', () => {
  const stop = vi.fn();
  const unsubscribe = vi.fn();
  let subscriptions: RealtimeSubscription[];

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal('BroadcastChannel', class {});
    subscriptions = [];
    connect.mockReturnValue(stop);
    getStatus.mockReturnValue('disconnected');
    subscribe.mockImplementation((subscription: RealtimeSubscription) => {
      subscriptions.push(subscription);
      return unsubscribe;
    });
    stop.mockResolvedValue(undefined);
    await import('./realtimeShared.worker');
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('같은 여행에서 탭 하나를 닫아도 남은 탭의 참여와 연결을 유지한다', async () => {
    const first = attach();
    subscribeToPresence(first);
    await Promise.resolve();
    subscriptions[0].onSubscribed?.();
    subscriptions[0].onMessage({ members: [7] });

    const second = attach();
    subscribeToPresence(second);
    await Promise.resolve();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(second.messages).toContainEqual({ type: 'message', id: 1, body: { members: [7] } });

    first.receive({ type: 'detach' });
    await vi.advanceTimersByTimeAsync(15_000);
    expect(publish.mock.calls.map(([destination]) => destination)).toEqual(['join', 'heartbeat']);
    expect(stop).not.toHaveBeenCalled();
    expect(unsubscribe).not.toHaveBeenCalled();

    second.receive({ type: 'detach' });
    expect(publish).toHaveBeenLastCalledWith('leave');
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('저장 결과를 해당 requestId를 구독한 탭에만 전달한다', () => {
    const first = attach();
    const second = attach();
    for (const [port, requestId] of [
      [first, 'a'],
      [second, 'b'],
    ] as const) {
      port.receive({
        type: 'subscribe',
        id: 1,
        subscription: { destination: '/user/queue/command-results', rejectable: false, requestId },
      });
    }
    const body = { data: { requestId: 'b', status: 'SUCCEEDED' } };
    subscriptions[0].onMessage(body);
    expect(first.messages.some(({ type }) => type === 'message')).toBe(false);
    expect(second.messages).toContainEqual({ type: 'message', id: 1, body });
  });

  it('종료 통지가 없으면 유효기간이 지난 포트와 구독을 정리한다', async () => {
    const active = attach();
    const lost = attach();
    subscribeToPresence(active);
    subscribeToPresence(lost);
    await Promise.resolve();
    subscriptions[0].onSubscribed?.();
    await vi.advanceTimersByTimeAsync(PORT_LEASE_MS / 2);
    active.receive({ type: 'ping' });
    await vi.advanceTimersByTimeAsync(PORT_LEASE_MS / 2);
    expect(lost.close).toHaveBeenCalledOnce();
    expect(active.close).not.toHaveBeenCalled();
    expect(record).toHaveBeenLastCalledWith('shared', 'worker-counts', {
      ports: 1,
      subscriptions: 1,
      listeners: 1,
    });
    expect(stop).not.toHaveBeenCalled();
  });

  it('다른 계정의 포트는 기존 연결에 붙이지 않는다', async () => {
    attach();
    const otherAccount = attach(8);
    await Promise.resolve();
    expect(otherAccount.messages).toEqual([{ type: 'unauthorized' }]);
    expect(otherAccount.close).toHaveBeenCalledOnce();
    expect(connect).toHaveBeenCalledOnce();
  });
});
