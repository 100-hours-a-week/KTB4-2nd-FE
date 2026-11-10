import { afterEach, describe, expect, it, vi } from 'vitest';

import { setRealtimeStatus, waitForRealtimeConnection } from './realtimeStatus';

describe('waitForRealtimeConnection', () => {
  afterEach(() => {
    vi.useRealTimers();
    setRealtimeStatus('disconnected');
  });

  it('이미 연결돼 있으면 바로 true를 돌려준다', async () => {
    setRealtimeStatus('connected');

    await expect(waitForRealtimeConnection(1_000)).resolves.toBe(true);
  });

  it('기다리는 동안 연결되면 true를 돌려준다', async () => {
    vi.useFakeTimers();
    const result = waitForRealtimeConnection(5_000);

    setRealtimeStatus('connecting');
    await vi.advanceTimersByTimeAsync(1_000);
    setRealtimeStatus('connected');

    await expect(result).resolves.toBe(true);
  });

  it('시간 안에 연결되지 않으면 false를 돌려준다', async () => {
    vi.useFakeTimers();
    const result = waitForRealtimeConnection(5_000);

    setRealtimeStatus('connecting');
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(result).resolves.toBe(false);
  });
});
