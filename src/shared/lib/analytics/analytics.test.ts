import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearIdentity, EVENTS, identify, setClarityTag, track } from './analytics';

const { sendGAEvent } = vi.hoisted(() => ({ sendGAEvent: vi.fn() }));

vi.mock('@next/third-parties/google', () => ({ sendGAEvent }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  delete window.clarity;
});

function enableAnalytics() {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'true');
  window.clarity = vi.fn();
}

describe('analytics', () => {
  it('개발 환경에서는 이벤트를 전송하지 않는다', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'true');
    window.clarity = vi.fn();

    track(EVENTS.LOGIN, { method: 'kakao' });

    expect(sendGAEvent).not.toHaveBeenCalled();
    expect(window.clarity).not.toHaveBeenCalled();
  });

  it('운영에서 같은 이벤트를 GA와 Clarity에 전송한다', () => {
    enableAnalytics();

    track(EVENTS.PHOTO_UPLOAD_START, { photo_count: 12 });

    expect(sendGAEvent).toHaveBeenCalledWith('event', 'photo_upload_start', {
      photo_count: 12,
    });
    expect(window.clarity).toHaveBeenCalledWith('event', 'photo_upload_start');
  });

  it('내부 사용자 ID만 문자열로 식별하고 로그아웃 시 해제한다', () => {
    enableAnalytics();

    identify(123, { signup_method: 'kakao' });
    clearIdentity();

    expect(sendGAEvent).toHaveBeenNthCalledWith(1, 'set', { user_id: '123' });
    expect(sendGAEvent).toHaveBeenNthCalledWith(2, 'set', 'user_properties', {
      signup_method: 'kakao',
    });
    expect(sendGAEvent).toHaveBeenNthCalledWith(3, 'set', { user_id: null });
    expect(window.clarity).toHaveBeenCalledWith('identify', '123');
  });

  it('Clarity 세션 태그 값은 문자열로 통일한다', () => {
    enableAnalytics();

    setClarityTag('photo_count', 12);

    expect(window.clarity).toHaveBeenCalledWith('set', 'photo_count', '12');
  });
});
