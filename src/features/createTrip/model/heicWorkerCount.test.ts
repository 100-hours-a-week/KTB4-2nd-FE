import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HEIC_WORKER_COUNT_OVERRIDE_KEY, calculateHeicWorkerCount } from './heicWorkerCount';

function stubDevice(hardwareConcurrency: number, deviceMemory?: number) {
  vi.stubGlobal('navigator', { hardwareConcurrency, deviceMemory });
}

describe('calculateHeicWorkerCount', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('코어 절반을 쓰되 측정으로 정한 상한 4개를 넘지 않는다', () => {
    stubDevice(10);
    expect(calculateHeicWorkerCount()).toBe(4);

    stubDevice(6);
    expect(calculateHeicWorkerCount()).toBe(3);

    stubDevice(4);
    expect(calculateHeicWorkerCount()).toBe(2);

    stubDevice(1);
    expect(calculateHeicWorkerCount()).toBe(1);
  });

  it('메모리를 알 수 있으면 메모리가 적은 기기에서 Worker를 줄인다', () => {
    stubDevice(8, 2);
    expect(calculateHeicWorkerCount()).toBe(1);

    stubDevice(8, 4);
    expect(calculateHeicWorkerCount()).toBe(2);

    stubDevice(8, 8);
    expect(calculateHeicWorkerCount()).toBe(4);
  });

  it('코어 수를 알 수 없으면 상한값을 기준으로 계산한다', () => {
    stubDevice(0);
    expect(calculateHeicWorkerCount()).toBe(2);
  });

  it('측정용으로 저장한 값이 있으면 코어 수 안에서 그 값을 쓴다', () => {
    stubDevice(10, 2);
    window.localStorage.setItem(HEIC_WORKER_COUNT_OVERRIDE_KEY, '6');
    expect(calculateHeicWorkerCount()).toBe(6);

    window.localStorage.setItem(HEIC_WORKER_COUNT_OVERRIDE_KEY, '16');
    expect(calculateHeicWorkerCount()).toBe(10);

    window.localStorage.setItem(HEIC_WORKER_COUNT_OVERRIDE_KEY, 'abc');
    expect(calculateHeicWorkerCount()).toBe(1);
  });
});

describe('getHeicWorkerCount', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('처음 계산한 값을 계속 써서 Worker 수와 변환 큐 크기가 어긋나지 않는다', async () => {
    stubDevice(8);
    const { getHeicWorkerCount } = await import('./heicWorkerCount');
    expect(getHeicWorkerCount()).toBe(4);

    stubDevice(2);
    expect(getHeicWorkerCount()).toBe(4);
  });
});
