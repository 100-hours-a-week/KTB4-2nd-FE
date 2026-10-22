import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTrips } from '../api/getTrips';
import { useTripList } from './useTripList';

vi.mock('../api/getTrips', () => ({ getTrips: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useTripList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('2페이지 조회가 실패하면 다음 페이지를 다시 요청하지 않고 오류 상태로 멈춘다', async () => {
    vi.mocked(getTrips)
      .mockResolvedValueOnce({ trips: [], hasNext: true, nextCursor: 'cursor-2' })
      .mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useTripList({ sort: 'LATEST', favorite: false }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.viewState).toBe('error'));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(getTrips).toHaveBeenCalledTimes(2);
  });
});
