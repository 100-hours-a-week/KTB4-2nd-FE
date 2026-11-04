import type { StompConfig } from '@stomp/stompjs';
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { connectRealtime, subscribeRealtime } from './realtimeClient';
import { getRealtimeStatus, realtimePollingInterval } from './realtimeStatus';

const { clients, fetchCsrfToken, refreshSession } = vi.hoisted(() => ({
  clients: [] as FakeClient[],
  fetchCsrfToken: vi.fn(),
  refreshSession: vi.fn(),
}));

type FakeClient = {
  config: StompConfig;
  connectHeaders: Record<string, string>;
  connected: boolean;
  webSocket: undefined;
  subscribe: ReturnType<typeof vi.fn>;
  activate: ReturnType<typeof vi.fn>;
  deactivate: ReturnType<typeof vi.fn>;
};

vi.mock('@stomp/stompjs', () => ({
  ReconnectionTimeMode: { LINEAR: 0, EXPONENTIAL: 1 },
  Client: vi.fn(function (this: FakeClient, config: StompConfig) {
    this.config = config;
    this.connectHeaders = {};
    this.connected = false;
    this.webSocket = undefined;
    this.subscribe = vi.fn(() => ({ unsubscribe: vi.fn() }));
    this.activate = vi.fn();
    this.deactivate = vi.fn(() => Promise.resolve());
    clients.push(this);
  }),
}));
vi.mock('../browser', () => ({ fetchCsrfToken, refreshSession }));

function latestClient() {
  return clients[clients.length - 1];
}

async function connect(client: FakeClient) {
  await client.config.beforeConnect?.(client as never);
  client.connected = true;
  client.config.onConnect?.({} as never);
}

function close(client: FakeClient) {
  client.connected = false;
  client.config.onWebSocketClose?.({} as never);
}

describe('connectRealtime', () => {
  beforeEach(() => {
    clients.length = 0;
    vi.clearAllMocks();
    fetchCsrfToken.mockResolvedValue('csrf-token');
    refreshSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('CSRF 값을 CONNECT 헤더에 넣고, 연결되면 구독한 알림 본문을 JSON으로 전달한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEBSOCKET_URL', 'ws://localhost:8081/api/ws');
    const onMessage = vi.fn();
    const stop = connectRealtime([{ destination: '/user/queue/ai-tasks', onMessage }]);
    const client = latestClient();

    expect(client.config.brokerURL).toBe('ws://localhost:8081/api/ws');
    expect(client.activate).toHaveBeenCalledTimes(1);

    await connect(client);

    expect(client.connectHeaders).toEqual({ 'X-CSRF-TOKEN': 'csrf-token' });
    expect(getRealtimeStatus()).toBe('connected');
    expect(realtimePollingInterval(2_000)).toBe(30_000);

    const [destination, handler] = client.subscribe.mock.calls[0];
    expect(destination).toBe('/user/queue/ai-tasks');
    handler({ body: '{"message":"TRIP_PROCESSING_STATUS_FOUND","data":{"tripId":1}}' });
    handler({ body: 'not-json' });
    expect(onMessage).toHaveBeenNthCalledWith(1, {
      message: 'TRIP_PROCESSING_STATUS_FOUND',
      data: { tripId: 1 },
    });
    expect(onMessage).toHaveBeenNthCalledWith(2, undefined);

    close(client);
    expect(getRealtimeStatus()).toBe('disconnected');
    expect(realtimePollingInterval(2_000)).toBe(2_000);

    stop();
  });

  it('설정이 없으면 화면과 같은 출처의 /api/ws로 연결한다', () => {
    vi.stubEnv('NEXT_PUBLIC_WEBSOCKET_URL', '');
    const stop = connectRealtime([]);

    expect(latestClient().config.brokerURL).toBe(`ws://${window.location.host}/api/ws`);
    stop();
  });

  it('연결되기 전에 거절되면 다음 연결 전에 세션을 한 번만 갱신한다', async () => {
    const stop = connectRealtime([]);
    const client = latestClient();

    await client.config.beforeConnect?.(client as never);
    close(client);
    await client.config.beforeConnect?.(client as never);
    expect(refreshSession).toHaveBeenCalledTimes(1);

    close(client);
    await connect(client);
    expect(refreshSession).toHaveBeenCalledTimes(1);

    // 연결된 뒤에 끊긴 경우는 네트워크 문제일 수 있어 바로 갱신하지 않습니다.
    close(client);
    await client.config.beforeConnect?.(client as never);
    expect(refreshSession).toHaveBeenCalledTimes(1);

    stop();
  });

  it('세션 갱신이 401이면 재연결을 멈춘다', async () => {
    const stop = connectRealtime([]);
    const client = latestClient();
    const response = {
      config: { headers: new AxiosHeaders() },
      data: {},
      headers: {},
      status: 401,
      statusText: 'Unauthorized',
    };
    refreshSession.mockRejectedValue(
      new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, response),
    );

    await client.config.beforeConnect?.(client as never);
    close(client);
    await client.config.beforeConnect?.(client as never);

    expect(client.deactivate).toHaveBeenCalledTimes(1);
    expect(getRealtimeStatus()).toBe('disconnected');
    stop();
    expect(client.deactivate).toHaveBeenCalledTimes(1);
  });

  it('CSRF 발급이 실패해도 예외를 던지지 않아 재연결이 이어진다', async () => {
    fetchCsrfToken.mockRejectedValue(new Error('offline'));
    const stop = connectRealtime([]);
    const client = latestClient();

    await expect(client.config.beforeConnect?.(client as never)).resolves.toBeUndefined();
    expect(client.deactivate).not.toHaveBeenCalled();
    stop();
  });

  it('연결을 닫은 뒤 늦게 도착한 콜백은 상태를 바꾸지 않는다', async () => {
    const stop = connectRealtime([]);
    const previous = latestClient();
    stop();
    expect(previous.deactivate).toHaveBeenCalledTimes(1);

    const stopNext = connectRealtime([]);
    await connect(latestClient());
    close(previous);

    expect(getRealtimeStatus()).toBe('connected');
    stopNext();
  });

  it('네트워크가 돌아오면 재연결 대기 없이 바로 다시 연결한다', async () => {
    const stop = connectRealtime([]);
    const client = latestClient();

    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(client.activate).toHaveBeenCalledTimes(2));
    expect(client.deactivate).toHaveBeenCalledTimes(1);

    stop();
    window.dispatchEvent(new Event('online'));
    expect(client.activate).toHaveBeenCalledTimes(2);
  });

  describe('subscribeRealtime', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('연결 중이면 바로 구독하고, 재연결되면 다시 구독하며, 해제하면 구독을 끊는다', async () => {
      const stop = connectRealtime([]);
      const client = latestClient();
      await connect(client);

      const unsubscribe = subscribeRealtime({
        destination: '/topic/trips/7/events',
        onMessage: vi.fn(),
      });
      expect(client.subscribe).toHaveBeenCalledTimes(1);

      close(client);
      await connect(client);
      expect(client.subscribe).toHaveBeenCalledTimes(2);

      const stompSubscription = client.subscribe.mock.results[1].value;
      unsubscribe();
      expect(stompSubscription.unsubscribe).toHaveBeenCalledTimes(1);

      close(client);
      await connect(client);
      expect(client.subscribe).toHaveBeenCalledTimes(2);
      stop();
    });

    it('연결 전에 등록한 구독은 연결되면 구독한다', async () => {
      const unsubscribe = subscribeRealtime({
        destination: '/topic/trips/7/events',
        onMessage: vi.fn(),
      });
      const stop = connectRealtime([]);
      const client = latestClient();

      await connect(client);
      expect(client.subscribe.mock.calls[0][0]).toBe('/topic/trips/7/events');

      unsubscribe();
      stop();
    });

    it('구독하자마자 연결이 두 번 연달아 끊기면 거절된 것으로 보고 다시 구독하지 않는다', async () => {
      vi.useFakeTimers();
      const stop = connectRealtime([{ destination: '/user/queue/ai-tasks', onMessage: vi.fn() }]);
      const client = latestClient();
      const onRejected = vi.fn();
      subscribeRealtime({ destination: '/topic/trips/7/events', onMessage: vi.fn(), onRejected });

      await connect(client);
      close(client);
      expect(onRejected).not.toHaveBeenCalled();

      await connect(client);
      close(client);
      expect(onRejected).toHaveBeenCalledTimes(1);

      client.subscribe.mockClear();
      await connect(client);
      expect(client.subscribe.mock.calls.map(([destination]) => destination)).toEqual([
        '/user/queue/ai-tasks',
      ]);
      stop();
    });

    it('구독이 한동안 유지된 뒤 끊긴 것은 거절로 세지 않는다', async () => {
      vi.useFakeTimers();
      const stop = connectRealtime([]);
      const client = latestClient();
      const onRejected = vi.fn();
      const unsubscribe = subscribeRealtime({
        destination: '/topic/trips/7/events',
        onMessage: vi.fn(),
        onRejected,
      });

      await connect(client);
      close(client);
      await connect(client);
      vi.advanceTimersByTime(5_000);
      close(client);
      await connect(client);
      close(client);

      expect(onRejected).not.toHaveBeenCalled();
      unsubscribe();
      stop();
    });
  });
});
