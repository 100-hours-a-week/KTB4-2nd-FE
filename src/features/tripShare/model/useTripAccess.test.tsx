import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyTripPermission } from '../api/getMyTripPermission';
import { useTripAccess } from './useTripAccess';

vi.mock('../api/getMyTripPermission', () => ({ getMyTripPermission: vi.fn() }));

function renderAccess() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useTripAccess(7), { wrapper });
}

describe('useTripAccess', () => {
  beforeEach(() => vi.clearAllMocks());

  it('확인하는 동안에는 모든 변경을 막는다', () => {
    vi.mocked(getMyTripPermission).mockReturnValue(new Promise(() => {}));

    expect(renderAccess().result.current).toEqual({
      isChecking: true,
      isOwner: false,
      canEdit: false,
    });
  });

  it.each([
    ['OWNER', { isOwner: true, canEdit: true }],
    ['WRITE', { isOwner: false, canEdit: true }],
    ['READ', { isOwner: false, canEdit: false }],
  ] as const)('%s 권한이면 그에 맞게 허용한다', async (permission, expected) => {
    vi.mocked(getMyTripPermission).mockResolvedValue(permission);
    const { result } = renderAccess();

    await waitFor(() => expect(result.current).toEqual({ isChecking: false, ...expected }));
    expect(getMyTripPermission).toHaveBeenCalledWith(7);
  });

  it('권한을 확인하지 못하거나 알 수 없는 값이면 막지 않고 실제 거절은 백엔드에 맡긴다', async () => {
    vi.mocked(getMyTripPermission).mockResolvedValueOnce(null);
    const unknown = renderAccess();
    await waitFor(() => expect(unknown.result.current.isChecking).toBe(false));
    expect(unknown.result.current).toEqual({ isChecking: false, isOwner: true, canEdit: true });

    vi.mocked(getMyTripPermission).mockRejectedValueOnce(new Error('failed'));
    const failed = renderAccess();
    await waitFor(() => expect(failed.result.current.isChecking).toBe(false));
    expect(failed.result.current).toEqual({ isChecking: false, isOwner: true, canEdit: true });
  });
});
