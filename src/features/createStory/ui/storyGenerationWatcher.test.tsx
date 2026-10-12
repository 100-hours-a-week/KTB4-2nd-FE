import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/shared/ui/toast';

import { getStoryGenerationStatus } from '../api/getStoryGenerationStatus';
import { readStoryCreateDraft, updateStoryCreateDraft } from '../model/storyCreateDraft';
import { StoryGenerationWatcher } from './storyGenerationWatcher';

const { refresh, pathname } = vi.hoisted(() => ({
  refresh: vi.fn(),
  pathname: { current: '/trips' },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => pathname.current,
}));
vi.mock('@/shared/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/getStoryGenerationStatus', () => ({ getStoryGenerationStatus: vi.fn() }));

function status(generationId: number, value: 'PROCESSING' | 'COMPLETED' | 'FAILED') {
  return { generationId, status: value, progress: 50, storyId: null, error: null };
}

function renderWatcher() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <StoryGenerationWatcher />
    </QueryClientProvider>,
  );
}

describe('StoryGenerationWatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    pathname.current = '/trips';
  });

  it('생성 화면을 나가도 완료되면 토스트로 알리고 임시 저장을 지운다', async () => {
    updateStoryCreateDraft(7, { mood: 'CALM', tripPlaceIds: [1], generationId: 31 });
    vi.mocked(getStoryGenerationStatus).mockResolvedValue(status(31, 'COMPLETED'));
    renderWatcher();

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(window.localStorage.getItem('story-create-draft-v1:7')).toBeNull();
    expect(refresh).toHaveBeenCalled();
  });

  it('실패하면 알리고 고른 값은 남긴 채 진행 기록만 지운다', async () => {
    updateStoryCreateDraft(7, { mood: 'CALM', tripPlaceIds: [1], generationId: 31 });
    vi.mocked(getStoryGenerationStatus).mockResolvedValue(status(31, 'FAILED'));
    renderWatcher();

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(readStoryCreateDraft(7)).toMatchObject({
      mood: 'CALM',
      tripPlaceIds: [1],
      generationId: null,
    });
  });

  it('해당 여행의 생성 화면에 있으면 화면이 직접 보여주므로 알리지 않는다', async () => {
    pathname.current = '/trips/7/story/create';
    updateStoryCreateDraft(7, { mood: 'CALM', tripPlaceIds: [1], generationId: 31 });
    vi.mocked(getStoryGenerationStatus).mockResolvedValue(status(31, 'COMPLETED'));
    renderWatcher();

    await waitFor(() => expect(getStoryGenerationStatus).toHaveBeenCalledWith(31));
    expect(toast.success).not.toHaveBeenCalled();
    expect(readStoryCreateDraft(7).generationId).toBe(31);
  });

  it('화면이 떠 있는 동안 새로 시작한 작업도 이어서 확인한다', async () => {
    vi.mocked(getStoryGenerationStatus).mockResolvedValue(status(40, 'COMPLETED'));
    renderWatcher();
    expect(getStoryGenerationStatus).not.toHaveBeenCalled();

    act(() => updateStoryCreateDraft(8, { mood: 'PLAIN', tripPlaceIds: [2], generationId: 40 }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(getStoryGenerationStatus).toHaveBeenCalledWith(40);
  });
});
