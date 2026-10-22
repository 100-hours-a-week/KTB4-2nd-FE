import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAiStatus } from '@/features/aiStatus/api/getAiStatus';
import { cancelStoryGeneration } from '@/features/createStory/api/cancelStoryGeneration';
import { createStoryGeneration } from '@/features/createStory/api/createStoryGeneration';
import { getStoryGenerationStatus } from '@/features/createStory/api/getStoryGenerationStatus';
import { getStorySourceFolders } from '@/features/createStory/api/getStorySourceFolders';
import type { TripDetail } from '@/features/tripDetail';
import { StoryCreatePage } from './storyCreatePage';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('@/features/aiStatus/api/getAiStatus', () => ({ getAiStatus: vi.fn() }));
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
const DRAFT_KEY = 'story-create-draft-v1:7';

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
  await user.click(screen.getByRole('button', { name: '다음' }));
  const boxes = await screen.findAllByRole('checkbox');
  for (const index of folderIndexes) await user.click(boxes[index]);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
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
  vi.mocked(getAiStatus).mockResolvedValue({ running: true, ready: true });
});

describe('StoryCreatePage', () => {
  it('기본 선택 없이 시작하고 분위기를 하나만 선택한다', async () => {
    const { user } = setup();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    expect(
      screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked),
    ).toBe(true);
    await user.click(screen.getByRole('radio', { name: /감성적으로/ }));
    await user.click(screen.getByRole('radio', { name: /차분하게/ }));
    expect(screen.getByRole('radio', { name: /감성적으로/ })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(await screen.findAllByRole('checkbox')).toHaveLength(6);
    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();
    expect(window.location.search).toBe('?step=folder');
  });

  it('사진 정리 중이라 폴더 조회가 409로 거절되면 정리 중 안내와 돌아가기 링크를 보여준다', async () => {
    const config = { headers: new AxiosHeaders() };
    vi.mocked(getStorySourceFolders).mockRejectedValue(
      new AxiosError('conflict', undefined, config, null, {
        status: 409,
        statusText: '',
        data: { message: 'STORY_GENERATION_NOT_ALLOWED', data: null },
        headers: {},
        config,
      }),
    );
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: /담백하게/ }));
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '사진을 정리하는 중이라 지금은 스토리를 만들 수 없어요.',
    );
    expect(screen.getByRole('link', { name: '여행 상세로 돌아가기' })).toHaveAttribute(
      'href',
      '/trips/7',
    );
    expect(getStorySourceFolders).toHaveBeenCalledTimes(1);
  });

  it('저장해 둔 선택 중 사진이 0장이 되었거나 사라진 폴더는 선택에서 뺀다', async () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        mood: 'PLAIN',
        tripPlaceIds: [1, 2, 99],
        generationId: null,
        startedAt: null,
      }),
    );
    vi.mocked(getStorySourceFolders).mockResolvedValue({
      folders: [
        { id: 1, name: '장소 1', photoCount: 3, thumbnailUrl: null, accent: 'coast' },
        { id: 2, name: '장소 2', photoCount: 0, thumbnailUrl: null, accent: 'coast' },
      ],
      hasNext: false,
      nextCursor: null,
    });
    window.history.replaceState(null, '', '/trips/7/story/create?step=folder');
    setup();

    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}')).toMatchObject({
        tripPlaceIds: [1],
      }),
    );
    expect(screen.getByRole('checkbox', { name: '장소 1 사진 3장 선택' })).toBeChecked();
    expect(screen.getByLabelText('선택한 폴더 수')).toHaveTextContent('1 / 10');
  });

  it('아직 불러오지 않은 페이지에 있을 수 있는 폴더는 선택을 유지한다', async () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ mood: 'PLAIN', tripPlaceIds: [1, 99], generationId: null, startedAt: null }),
    );
    vi.mocked(getStorySourceFolders).mockResolvedValue({
      folders: [{ id: 1, name: '장소 1', photoCount: 3, thumbnailUrl: null, accent: 'coast' }],
      hasNext: true,
      nextCursor: 'cursor-2',
    });
    window.history.replaceState(null, '', '/trips/7/story/create?step=folder');
    setup();

    await screen.findByRole('checkbox', { name: '장소 1 사진 3장 선택' });
    expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}')).toMatchObject({
      tripPlaceIds: [1, 99],
    });
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

  it('고른 분위기와 폴더를 저장해 새로고침 후에도 그대로 복원한다', async () => {
    const { user, unmount } = setup();
    await chooseMoodAndFolders(user, [2, 0]);

    expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}')).toMatchObject({
      mood: 'PLAIN',
      tripPlaceIds: [3, 1],
    });

    unmount();
    setup();

    expect(await screen.findByRole('checkbox', { name: '장소 3 사진 3장 선택' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: '장소 1 사진 3장 선택' })).toBeChecked();
    expect(screen.getByLabelText('선택한 폴더 수')).toHaveTextContent('2 / 10');
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
    expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}')).toMatchObject({
      generationId: 31,
    });
  });

  it('AI 서버가 켜지는 중이면 생성 요청 대신 준비 중 안내를 보여준다', async () => {
    vi.mocked(getAiStatus).mockResolvedValue({ running: true, ready: false });
    const { user } = setup();
    await chooseMoodAndFolders(user, [0]);
    await user.click(screen.getByRole('button', { name: '생성' }));

    const dialog = await screen.findByRole('dialog', { name: 'AI를 준비하고 있어요' });
    expect(dialog).toHaveTextContent('보통 3분 정도 걸려요.');
    expect(createStoryGeneration).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: '확인' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '생성' })).toBeEnabled();
  });

  it('AI 서버가 꺼져 있으면 사용할 수 없다고 안내한다', async () => {
    vi.mocked(getAiStatus).mockResolvedValue({ running: false, ready: false });
    const { user } = setup();
    await chooseMoodAndFolders(user, [0]);
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(
      await screen.findByRole('dialog', { name: '지금은 AI 이용 시간이 아니에요' }),
    ).toBeInTheDocument();
    expect(createStoryGeneration).not.toHaveBeenCalled();
  });

  it('새로고침해도 저장된 생성 작업의 진행 상태를 이어서 보여준다', async () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ mood: 'CALM', tripPlaceIds: [1], generationId: 31, startedAt: Date.now() }),
    );
    setup();

    await waitFor(() =>
      expect(screen.getByRole('progressbar', { name: '스토리 생성 진행률' })).toHaveAttribute(
        'aria-valuenow',
        '40',
      ),
    );
    expect(createStoryGeneration).not.toHaveBeenCalled();
  });

  it('생성이 완료되면 임시 저장을 지우고 스토리 보기로 이동한다', async () => {
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
    expect(replace).toHaveBeenCalledWith('/trips/7/story');
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('완성 화면에서 상단 뒤로가기를 누르면 폴더 선택이 아니라 여행 상세로 나간다', async () => {
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
    await screen.findByRole('button', { name: '스토리 보기' });

    await user.click(screen.getByRole('button', { name: '스토리 생성에서 돌아가기' }));

    expect(replace).toHaveBeenCalledWith('/trips/7');
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('생성에 실패하면 화면에서 알린 뒤 저장된 작업 번호를 지워, 나가도 다시 알리지 않는다', async () => {
    vi.mocked(getStoryGenerationStatus).mockResolvedValue({
      generationId: 31,
      status: 'FAILED',
      progress: 10,
      storyId: null,
      error: { code: 'STORY_GENERATION_FAILED', message: '스토리 생성에 실패했습니다.' },
    });
    const { user } = setup();
    await chooseMoodAndFolders(user);
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(await screen.findByRole('button', { name: '다시 시도하기' })).toBeInTheDocument();
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}')).toMatchObject({
        generationId: null,
      }),
    );
  });

  it('폴더 단계에서 뒤로가면 분위기 단계 기록을 새로 쌓지 않고 이전 기록으로 돌아간다', async () => {
    const back = vi.spyOn(window.history, 'back');
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: /담백하게/ }));
    await user.click(screen.getByRole('button', { name: '다음' }));
    await screen.findAllByRole('checkbox');

    await user.click(screen.getByRole('button', { name: '분위기 선택으로 돌아가기' }));

    expect(back).toHaveBeenCalledOnce();
    back.mockRestore();
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
    expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}')).toMatchObject({
      generationId: null,
    });
  });

  it('다른 작업 이어하기는 취소 없이 여행 상세로 이동한다', async () => {
    const { user } = setup();
    await chooseMoodAndFolders(user);
    await user.click(screen.getByRole('button', { name: '생성' }));
    await screen.findByRole('progressbar', { name: '스토리 생성 진행률' });

    await user.click(screen.getByRole('button', { name: '다른 작업 이어하기' }));
    expect(replace).toHaveBeenCalledWith('/trips/7');
    expect(cancelStoryGeneration).not.toHaveBeenCalled();
    expect(screen.getByRole('status', { name: '스토리 생성 중' })).toBeInTheDocument();
  });
});
