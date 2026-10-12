import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelStoryGeneration } from '@/features/createStory/api/cancelStoryGeneration';
import { createStoryGeneration } from '@/features/createStory/api/createStoryGeneration';
import { getStoryGenerationStatus } from '@/features/createStory/api/getStoryGenerationStatus';
import { getStorySourceFolders } from '@/features/createStory/api/getStorySourceFolders';
import { clearStoryGenerationJobs } from '@/features/createStory/model/storyGenerationStore';
import type { TripDetail } from '@/features/tripDetail';
import { StoryCreatePage } from './storyCreatePage';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('@/features/createStory/api/getStorySourceFolders', () => ({
  getStorySourceFolders: vi.fn(),
}));
vi.mock('@/features/createStory/api/createStoryGeneration', () => ({
  createStoryGeneration: vi.fn(),
}));
vi.mock('@/features/createStory/api/getStoryGenerationStatus', () => ({
  getStoryGenerationStatus: vi.fn(),
}));
vi.mock('@/features/createStory/api/cancelStoryGeneration', () => ({
  cancelStoryGeneration: vi.fn(),
}));

const trip: TripDetail = {
  id: 7,
  name: '제주도 가을 여행',
  locations: ['제주'],
  startDate: '2026-10-12',
  endDate: '2026-10-14',
  nights: 2,
  photoCount: 128,
  reviewCount: 0,
  hasStory: false,
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <StoryCreatePage trip={trip} nickname="여담" />
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), unmount: view.unmount };
}

async function chooseMoodAndFolders(user: ReturnType<typeof userEvent.setup>, folderIndexes = [0]) {
  await user.click(screen.getByRole('radio', { name: /담백하게/ }));
  await user.click(screen.getByRole('button', { name: '생성' }));
  const boxes = await screen.findAllByRole('checkbox');
  for (const index of folderIndexes) await user.click(boxes[index]);
}

beforeEach(() => {
  vi.clearAllMocks();
  clearStoryGenerationJobs();
  window.history.replaceState(null, '', '/trips/7/story/create');
  vi.mocked(getStorySourceFolders).mockResolvedValue({
    folders: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `장소 ${i + 1}`,
      photoCount: 3,
      thumbnailUrl: null,
      accent: 'coast' as const,
    })),
    hasNext: false,
    nextCursor: null,
  });
  vi.mocked(createStoryGeneration).mockResolvedValue({
    generationId: 31,
    tripId: 7,
    status: 'QUEUED',
  });
  vi.mocked(getStoryGenerationStatus).mockResolvedValue({
    generationId: 31,
    status: 'PROCESSING',
    progress: 40,
    storyId: null,
    error: null,
  });
  vi.mocked(cancelStoryGeneration).mockResolvedValue(undefined);
});

afterEach(() => clearStoryGenerationJobs());

describe('StoryCreatePage', () => {
  it('기본 선택 없이 시작하고 분위기를 하나만 선택한다', async () => {
    const { user } = setup();
    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();
    expect(
      screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked),
    ).toBe(true);
    await user.click(screen.getByRole('radio', { name: /감성적으로/ }));
    await user.click(screen.getByRole('radio', { name: /차분하게/ }));
    expect(screen.getByRole('radio', { name: /감성적으로/ })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: '생성' }));
    expect(await screen.findAllByRole('checkbox')).toHaveLength(6);
    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();
  });

  it('최대 10개만 선택하고 선택 해제 후 다른 폴더를 선택한다', async () => {
    const { user } = setup();
    await chooseMoodAndFolders(user, []);
    await user.click(screen.getByRole('button', { name: '폴더 더 보기' }));
    const boxes = screen.getAllByRole('checkbox');
    for (const box of boxes.slice(0, 11)) await user.click(box);
    expect(boxes[10]).not.toBeChecked();
    expect(screen.getByLabelText('선택한 폴더 수')).toHaveTextContent('10 / 10');
    await user.click(boxes[0]);
    await user.click(boxes[10]);
    expect(boxes[10]).toBeChecked();
  });

  it('고른 순서대로 생성 요청을 보내고 진행 상태를 보여준다', async () => {
    const { user } = setup();
    await chooseMoodAndFolders(user, [2, 0]);
    await user.click(screen.getByRole('button', { name: '생성' }));

    await waitFor(() =>
      expect(createStoryGeneration).toHaveBeenCalledWith(
        7,
        { mood: 'PLAIN', tripPlaceIds: [3, 1] },
        'csrf-token',
      ),
    );
    expect(await screen.findByRole('progressbar', { name: '스토리 생성 진행률' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
    expect(getStoryGenerationStatus).toHaveBeenCalledWith(31);
  });

  it('생성이 완료되면 스토리 보기로 이동한다', async () => {
    vi.mocked(getStoryGenerationStatus).mockResolvedValue({
      generationId: 31,
      status: 'COMPLETED',
      progress: 100,
      storyId: 5,
      error: null,
    });
    const { user } = setup();
    await chooseMoodAndFolders(user);
    await user.click(screen.getByRole('button', { name: '생성' }));

    await user.click(await screen.findByRole('button', { name: '스토리 보기' }));
    expect(push).toHaveBeenCalledWith('/trips/7/story');
  });

  it('생성에 실패하면 같은 선택으로 다시 시도할 수 있다', async () => {
    vi.mocked(getStoryGenerationStatus).mockResolvedValueOnce({
      generationId: 31,
      status: 'FAILED',
      progress: 10,
      storyId: null,
      error: { code: 'STORY_GENERATION_FAILED', message: '스토리 생성에 실패했습니다.' },
    });
    const { user } = setup();
    await chooseMoodAndFolders(user);
    await user.click(screen.getByRole('button', { name: '생성' }));

    await user.click(await screen.findByRole('button', { name: '다시 시도하기' }));
    await waitFor(() => expect(createStoryGeneration).toHaveBeenCalledTimes(2));
    expect(createStoryGeneration).toHaveBeenLastCalledWith(
      7,
      { mood: 'PLAIN', tripPlaceIds: [1] },
      'csrf-token',
    );
  });

  it('생성 중 뒤로가기에는 취소 모달이 나타나고 취소하면 폴더 선택이 유지된다', async () => {
    const { user } = setup();
    await chooseMoodAndFolders(user);
    await user.click(screen.getByRole('button', { name: '생성' }));
    expect(await screen.findByRole('button', { name: /스토리 생성 중/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '스토리 생성에서 돌아가기' }));
    let dialog = screen.getByRole('dialog', { name: '스토리 생성을 취소할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '이어서 만들기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '스토리 생성에서 돌아가기' }));
    dialog = screen.getByRole('dialog', { name: '스토리 생성을 취소할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '취소하기' }));

    await waitFor(() => expect(cancelStoryGeneration).toHaveBeenCalledWith(31, 'csrf-token'));
    expect(await screen.findByRole('checkbox', { name: '장소 1 사진 3장 선택' })).toBeChecked();
  });

  it('다른 작업 이어하기는 취소 없이 여행 상세로 이동한다', async () => {
    const { user } = setup();
    await chooseMoodAndFolders(user);
    await user.click(screen.getByRole('button', { name: '생성' }));
    await screen.findByRole('progressbar', { name: '스토리 생성 진행률' });

    await user.click(screen.getByRole('button', { name: '다른 작업 이어하기' }));
    expect(push).toHaveBeenCalledWith('/trips/7');
    expect(cancelStoryGeneration).not.toHaveBeenCalled();
    expect(screen.getByRole('status', { name: '스토리 생성 중' })).toBeInTheDocument();
  });
});
