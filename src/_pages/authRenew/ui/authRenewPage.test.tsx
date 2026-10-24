import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { refreshSession } from '@/shared/api/browser';

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
});
