import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { issueBulkPhotoDownloadUrl, issuePhotoDownloadUrl } from '../api/photoDownload';
import { triggerDownload } from '../lib/triggerDownload';
import { usePhotoDownload } from './usePhotoDownload';

vi.mock('@/shared/api/browser', () => ({ fetchCsrfToken: vi.fn() }));
vi.mock('@/shared/ui/toast', () => ({
  toast: { warning: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
vi.mock('../api/photoDownload', () => ({
  issueBulkPhotoDownloadUrl: vi.fn(),
  issuePhotoDownloadUrl: vi.fn(),
}));
vi.mock('../lib/triggerDownload', () => ({ triggerDownload: vi.fn() }));

function renderDownloadHook() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const hook = renderHook(() => usePhotoDownload(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...hook, client };
}

describe('usePhotoDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCsrfToken).mockResolvedValue('csrf-token');
    vi.mocked(issueBulkPhotoDownloadUrl).mockResolvedValue({
      downloadUrl: 'https://cdn.test/photos.zip',
      fileName: 'photos.zip',
    });
  });

  it('201장을 요청하면 네트워크 요청 없이 경고만 한 번 표시한다', async () => {
    const { result, client } = renderDownloadHook();
    act(() => result.current.mutate(Array.from({ length: 201 }, (_, index) => index + 1)));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    await waitFor(() => expect(toast.warning).toHaveBeenCalledOnce());
    expect(toast.warning).toHaveBeenCalledWith('한 번에 200장까지 받을 수 있어요.');
    expect(fetchCsrfToken).not.toHaveBeenCalled();
    expect(issueBulkPhotoDownloadUrl).not.toHaveBeenCalled();
    expect(issuePhotoDownloadUrl).not.toHaveBeenCalled();
    expect(triggerDownload).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.isIdle).toBe(true);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });

  it('mutateAsync도 제한 초과 시 mutation을 시작하지 않는다', async () => {
    const { result, client } = renderDownloadHook();
    await act(async () => {
      await expect(
        result.current.mutateAsync(Array.from({ length: 201 }, (_, index) => index + 1)),
      ).rejects.toThrow('한 번에 200장까지 받을 수 있어요.');
    });

    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(result.current.isIdle).toBe(true);
    expect(fetchCsrfToken).not.toHaveBeenCalled();
    expect(issueBulkPhotoDownloadUrl).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledOnce();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('정확히 200장은 정상적으로 다운로드한다', async () => {
    const ids = Array.from({ length: 200 }, (_, index) => index + 1);
    const { result } = renderDownloadHook();
    await act(async () => {
      await result.current.mutateAsync(ids);
    });

    expect(issueBulkPhotoDownloadUrl).toHaveBeenCalledWith(ids, 'csrf-token');
    expect(triggerDownload).toHaveBeenCalledWith('https://cdn.test/photos.zip', 'photos.zip');
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('실제 요청 실패에는 실패 토스트를 표시한다', async () => {
    vi.mocked(issueBulkPhotoDownloadUrl).mockRejectedValueOnce(new Error('failed'));
    const { result } = renderDownloadHook();
    act(() => result.current.mutate([1, 2]));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('사진을 다운로드하지 못했어요.'));
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
