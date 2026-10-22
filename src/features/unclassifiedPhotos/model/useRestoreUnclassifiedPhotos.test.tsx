import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { restoreAttachments } from '../api/restoreUnclassifiedPhotos';
import { BULK_RESTORE_LIMIT, type UnclassifiedPhoto } from './types';
import { useRestoreUnclassifiedPhotos } from './useRestoreUnclassifiedPhotos';

vi.mock('@/shared/api/browser', () => ({ fetchCsrfToken: vi.fn().mockResolvedValue('csrf') }));
vi.mock('@/shared/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/restoreUnclassifiedPhotos', () => ({
  restoreAttachment: vi.fn(),
  restoreAttachments: vi.fn(),
}));

function photos(count: number): UnclassifiedPhoto[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    restoreTripPlaceId: 10,
  })) as UnclassifiedPhoto[];
}

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const hook = renderHook(() => useRestoreUnclassifiedPhotos(3), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...hook, invalidate };
}

function invalidatedKeys(invalidate: ReturnType<typeof setup>['invalidate']) {
  return invalidate.mock.calls.map(([filters]) => filters?.queryKey);
}

describe('useRestoreUnclassifiedPhotos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('복원하면 여행 상세 요약(총 사진 수)·목록·지도·스토리 폴더 캐시를 모두 무효화한다', async () => {
    vi.mocked(restoreAttachments).mockResolvedValue(undefined);
    const { result, invalidate } = setup();

    await act(() => result.current.mutateAsync({ photos: photos(2) }));

    expect(invalidatedKeys(invalidate)).toEqual(
      expect.arrayContaining([
        ['tripList'],
        ['mainMap', 'markers'],
        ['tripDetail'],
        ['photoList'],
        ['unclassifiedPhotos'],
        ['storyCreate', 'sourceFolders'],
      ]),
    );
  });

  it('여러 묶음 중 두 번째 묶음이 실패해도 앞 묶음 복원 결과를 반영하도록 갱신한다', async () => {
    vi.mocked(restoreAttachments)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('network'));
    const { result, invalidate } = setup();

    await act(async () => {
      await result.current.mutateAsync({ photos: photos(BULK_RESTORE_LIMIT + 1) }).catch(() => {});
    });

    expect(restoreAttachments).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(invalidatedKeys(invalidate)).toEqual(expect.arrayContaining([['tripDetail']])),
    );
  });
});
