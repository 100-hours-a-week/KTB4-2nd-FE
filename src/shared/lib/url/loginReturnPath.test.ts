import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { saveLoginReturnPath, takeLoginReturnPath } from './loginReturnPath';

describe('loginReturnPath', () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => vi.useRealTimers());

  it('기억한 경로를 한 번만 꺼내고, 없으면 홈으로 보낸다', () => {
    saveLoginReturnPath('/trips/7?view=map');

    expect(takeLoginReturnPath()).toBe('/trips/7?view=map');
    expect(takeLoginReturnPath()).toBe('/');
  });

  it('홈, 로그인, 다른 사이트로 해석되는 경로는 기억하지 않는다', () => {
    for (const path of ['/', '/login', '/auth/renew?next=/trips/7', '//evil.com/trips']) {
      saveLoginReturnPath(path);
      expect(takeLoginReturnPath()).toBe('/');
    }
  });

  it('15분이 지난 경로는 쓰지 않는다', () => {
    vi.useFakeTimers();
    saveLoginReturnPath('/trips/7');
    vi.advanceTimersByTime(15 * 60_000 + 1);

    expect(takeLoginReturnPath()).toBe('/');
  });
});
