import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addPendingTripProcessing,
  getPendingTripProcessingSnapshot,
} from '@/features/createTrip/model/pendingTripProcessing';

import { deleteTrip } from '../api/deleteTrip';
import { useDeleteTrip } from './useDeleteTrip';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/shared/api/browser', () => ({ fetchCsrfToken: vi.fn().mockResolvedValue('csrf') }));
vi.mock('@/shared/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/deleteTrip', () => ({ deleteTrip: vi.fn() }));

describe('useDeleteTrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('여행을 지우면 그 여행의 작성 중 스토리, 백그라운드 확인 기록, 캐시를 함께 정리한다', async () => {
    vi.mocked(deleteTrip).mockResolvedValue(undefined);
    window.localStorage.setItem('story-create-draft-v1:7', JSON.stringify({ mood: 'CALM' }));
    addPendingTripProcessing({ tripId: 7, kind: 'edit' });
    const client = new QueryClient();
    client.setQueryData(['tripStory', 7], { story: true });
    client.setQueryData(['unclassifiedPhotos', 7, 'folders'], []);

    const { result } = renderHook(() => useDeleteTrip(7), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(() => result.current.mutateAsync());

    expect(window.localStorage.getItem('story-create-draft-v1:7')).toBeNull();
    expect(getPendingTripProcessingSnapshot()).toBe('');
    expect(client.getQueryData(['tripStory', 7])).toBeUndefined();
    expect(client.getQueryData(['unclassifiedPhotos', 7, 'folders'])).toBeUndefined();
  });
});
