import { render, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { refreshSession } from '@/shared/api/browser';
import { takeLoginReturnPath } from '@/shared/lib/url';

import { AuthRenewPage } from './authRenewPage';

vi.mock('@/shared/api/browser', () => ({ refreshSession: vi.fn() }));

const replace = vi.fn();

describe('AuthRenewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(refreshSession).mockResolvedValue(undefined);
    vi.stubGlobal('location', { ...window.location, origin: 'http://localhost:3000', replace });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('갱신에 성공하면 원래 경로에 renewed=1을 붙여 돌아간다', async () => {
    render(<AuthRenewPage returnTo="/trips/3?place=a" />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips/3?place=a&renewed=1'));
  });

  it('다른 사이트로 해석되는 경로면 홈으로 돌아간다', async () => {
    render(<AuthRenewPage returnTo="//evil.com/path" />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/?renewed=1'));
  });

  it('로그인이 끝난 상태면 로그인으로 보내면서, 로그인 뒤 돌아올 경로를 기억한다', async () => {
    const config = { headers: new AxiosHeaders() };
    vi.mocked(refreshSession).mockRejectedValue(
      new AxiosError('unauthorized', undefined, config, null, {
        status: 401,
        statusText: '',
        data: null,
        headers: {},
        config,
      }),
    );
    render(<AuthRenewPage returnTo="/trips/7" />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(takeLoginReturnPath()).toBe('/trips/7');
  });
});
