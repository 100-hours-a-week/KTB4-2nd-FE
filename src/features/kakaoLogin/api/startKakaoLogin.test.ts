import { afterEach, expect, it, vi } from 'vitest';

import { startKakaoLogin } from './startKakaoLogin';

afterEach(() => vi.unstubAllGlobals());

it.each(['https://production.example', 'https://staging.example'])(
  '카카오 로그인은 %s의 상대 /api 경로로 이동한다',
  (origin) => {
    const assign = vi.fn();
    vi.stubGlobal('window', { location: { origin, assign } });

    const navigation = startKakaoLogin();

    expect(assign).toHaveBeenCalledExactlyOnceWith('/api/auth/kakao/authorize');
    expect(new URL(assign.mock.calls[0][0], origin).href).toBe(
      `${origin}/api/auth/kakao/authorize`,
    );
    expect(navigation).toBeInstanceOf(Promise);
  },
);
