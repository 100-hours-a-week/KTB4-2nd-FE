import { describe, expect, it } from 'vitest';

import { getRenewRedirectPath, toSafeReturnPath } from './authRedirect';

describe('toSafeReturnPath', () => {
  it('같은 사이트 경로는 쿼리까지 그대로 받는다', () => {
    expect(toSafeReturnPath('/trips/3/places/10/photos?place=a&trip=b')).toBe(
      '/trips/3/places/10/photos?place=a&trip=b',
    );
  });

  it.each([
    ['//evil.com'],
    ['/\\evil.com'],
    ['/\\x//evil.com'],
    ['/\\@'],
    ['/\tevil'],
    ['https://evil.com'],
    ['evil.com'],
    [''],
    [undefined],
  ])('외부 주소로 해석될 수 있거나 읽을 수 없는 %s는 홈으로 바꾼다', (value) => {
    expect(toSafeReturnPath(value)).toBe('/');
  });
});

describe('getRenewRedirectPath', () => {
  it('처음이면 갱신 페이지로 보내며 돌아올 경로를 넘긴다', () => {
    expect(getRenewRedirectPath('/trips/3?x=1', undefined)).toBe(
      `/auth/renew?next=${encodeURIComponent('/trips/3?x=1')}`,
    );
  });

  it('이미 한 번 갱신하고 돌아왔으면 로그인으로 보내 반복을 막는다', () => {
    expect(getRenewRedirectPath('/trips/3', '1')).toBe('/login');
  });
});
