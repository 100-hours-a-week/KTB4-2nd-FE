import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exchangeLoginTicket } from '@/features/kakaoLogin';

import { AuthCallbackPage } from './authCallbackPage';

vi.mock('@/features/kakaoLogin', () => ({
  exchangeLoginTicket: vi.fn(),
}));

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('카카오 로그인을 취소하면 취소 안내를 표시한다', () => {
    render(<AuthCallbackPage errorCode="KAKAO_LOGIN_CANCELED" />);

    expect(screen.getByText('로그인을 취소했어요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '다시 로그인하기' })).toHaveAttribute('href', '/login');
    expect(exchangeLoginTicket).not.toHaveBeenCalled();
  });

  it('OAuth 상태가 만료되면 처음부터 다시 로그인하도록 안내한다', () => {
    render(<AuthCallbackPage errorCode="OAUTH_STATE_INVALID_OR_EXPIRED" />);

    expect(
      screen.getByText('로그인 시간이 지났어요. 처음부터 다시 시도해주세요.'),
    ).toBeInTheDocument();
    expect(exchangeLoginTicket).not.toHaveBeenCalled();
  });

  it('알 수 없는 오류는 공통 실패 안내로 처리한다', () => {
    render(<AuthCallbackPage errorCode="UNKNOWN_OAUTH_ERROR" />);

    expect(screen.getByText('잠시 후 다시 시도해주세요.')).toBeInTheDocument();
    expect(exchangeLoginTicket).not.toHaveBeenCalled();
  });

  it('오류와 로그인 티켓이 함께 전달되면 오류를 우선한다', () => {
    render(<AuthCallbackPage loginTicket="unused-login-ticket" errorCode="KAKAO_LOGIN_CANCELED" />);

    expect(screen.getByText('로그인을 취소했어요.')).toBeInTheDocument();
    expect(exchangeLoginTicket).not.toHaveBeenCalled();
  });

  it('파라미터가 없으면 로그인 시간이 지난 것으로 안내한다', () => {
    render(<AuthCallbackPage />);

    expect(
      screen.getByText('로그인 시간이 지났어요. 처음부터 다시 시도해주세요.'),
    ).toBeInTheDocument();
  });

  it('정상 로그인 티켓은 기존 교환 API로 전달한다', () => {
    vi.mocked(exchangeLoginTicket).mockReturnValue(new Promise(() => {}));

    render(<AuthCallbackPage loginTicket="valid-login-ticket" />);

    expect(screen.getByText('로그인하고 있어요')).toBeInTheDocument();
    expect(exchangeLoginTicket).toHaveBeenCalledOnce();
    expect(exchangeLoginTicket).toHaveBeenCalledWith('valid-login-ticket');
  });
});
