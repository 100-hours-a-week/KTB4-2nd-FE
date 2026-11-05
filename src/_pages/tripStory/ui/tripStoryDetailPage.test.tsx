import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAiStatus } from '@/features/aiStatus/api/getAiStatus';
import { getPlacePhotos } from '@/features/photoList/api/getPlacePhotos';
import { getTripPlaceFolders } from '@/features/tripDetail/api/getTripPlaceFolders';
import { getTripStory, type TripStoryResponse } from '@/features/tripStory';
import { getSimilarStoryPhotos } from '@/features/tripStory/api/getSimilarStoryPhotos';
import { previewStoryTone } from '@/features/tripStory/api/previewStoryTone';
import { updateTripStory } from '@/features/tripStory/api/updateTripStory';

import { TripStoryDetailPage } from './tripStoryDetailPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/features/tripStory/api/getTripStory', () => ({ getTripStory: vi.fn() }));
vi.mock('@/features/tripStory/api/updateTripStory', () => ({ updateTripStory: vi.fn() }));
vi.mock('@/features/tripStory/api/previewStoryTone', () => ({ previewStoryTone: vi.fn() }));
vi.mock('@/features/aiStatus/api/getAiStatus', () => ({ getAiStatus: vi.fn() }));
vi.mock('@/features/tripStory/api/getSimilarStoryPhotos', () => ({
  getSimilarStoryPhotos: vi.fn(),
}));
vi.mock('@/features/photoList/api/getPlacePhotos', () => ({ getPlacePhotos: vi.fn() }));
vi.mock('@/features/tripDetail/api/getTripPlaceFolders', () => ({ getTripPlaceFolders: vi.fn() }));
vi.mock('@/shared/api/browser', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api/browser')>()),
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
const trip = {
  id: 7,
  name: '서울 여행',
  locations: ['서울'],
  startDate: '2026-10-12',
  endDate: '2026-10-14',
  nights: 2,
  photoCount: 8,
  reviewCount: 0,
  hasStory: false,
};
const response: TripStoryResponse = {
  storyId: 9,
  tripId: 7,
  userByMe: true,
  mood: 'EMOTIONAL',
  storySummary: '서울의 가을',
  days: [
    {
      date: '2026-10-14',
      dayLabel: '셋째 날 · 남산',
      blocks: [
        {
          storyBlockId: 99,
          orderNumber: 1,
          tripPlaceId: 8,
          tripAttachmentId: 42,
          thumbnailUrl: 'https://cdn.test/preview.webp',
          detailSummary: '남산 · 산책',
          memo: '서울의 가을을 걸었다.',
        },
      ],
    },
  ],
};
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <TripStoryDetailPage trip={trip} />
    </QueryClientProvider>,
  );
}

describe('TripStoryDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTripStory).mockResolvedValue(response);
    vi.mocked(getAiStatus).mockResolvedValue({ running: true, ready: true });
  });

  it('API의 dayLabel, detailSummary, memo를 그대로 표시한다', async () => {
    renderPage();
    expect(await screen.findByText('서울의 가을을 걸었다.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '셋째 날 · 남산' })).toBeInTheDocument();
    expect(screen.getByText('남산 · 산책')).toBeInTheDocument();
    expect(screen.queryByText('예시 스토리')).not.toBeInTheDocument();
    expect(getTripStory).toHaveBeenCalledWith(7);
  });

  it('응답 전에는 빈 상태 대신 스켈레톤을 표시한다', async () => {
    let finish!: (value: TripStoryResponse) => void;
    vi.mocked(getTripStory).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderPage();
    expect(screen.getByRole('status', { name: '스토리 불러오는 중' })).toBeInTheDocument();
    expect(screen.queryByText('아직 만들어진 스토리가 없어요.')).not.toBeInTheDocument();
    await act(async () => {
      finish(response);
    });
    expect(await screen.findByText('서울의 가을을 걸었다.')).toBeInTheDocument();
  });

  it('스토리가 없는 404는 재시도하지 않고 빈 상태를 표시한다', async () => {
    const config = { headers: new AxiosHeaders() };
    vi.mocked(getTripStory).mockRejectedValue(
      new AxiosError('missing', undefined, config, null, {
        status: 404,
        statusText: 'Not Found',
        data: null,
        headers: {},
        config,
      }),
    );
    renderPage();
    expect(await screen.findByText('아직 만들어진 스토리가 없어요.')).toBeInTheDocument();
    expect(getTripStory).toHaveBeenCalledOnce();
  });

  it('조회 실패 시 안내 후 다시 시도로 복구할 수 있다', async () => {
    vi.mocked(getTripStory).mockRejectedValue(new Error('failed'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('스토리를 불러오지 못했어요.');
    vi.mocked(getTripStory).mockResolvedValue(response);
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('서울의 가을을 걸었다.')).toBeInTheDocument();
  });

  it('여행 주인이 아니면 편집 버튼을 보여주지 않는다', async () => {
    vi.mocked(getTripStory).mockResolvedValue({ ...response, userByMe: false });
    renderPage();
    expect(await screen.findByText('서울의 가을을 걸었다.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '스토리 편집' })).not.toBeInTheDocument();
  });

  it('편집한 요약·제목·문장을 수정 API로 저장하고 보기 화면에 반영한다', async () => {
    const user = userEvent.setup();
    vi.mocked(updateTripStory).mockResolvedValue({
      storyId: 9,
      tone: 'EMOTIONAL',
      storySummary: '단풍 든 남산',
      days: [
        {
          ...response.days[0],
          dayLabel: '마지막 날',
          blocks: [{ ...response.days[0].blocks[0], memo: '단풍이 예뻤다.' }],
        },
      ],
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: '스토리 편집' }));
    const summary = screen.getByRole('textbox', { name: '스토리 한 줄 요약' });
    await user.clear(summary);
    await user.type(summary, '단풍 든 남산');
    const dayLabel = screen.getByRole('textbox', { name: '10.14 날짜 제목' });
    await user.clear(dayLabel);
    await user.type(dayLabel, '마지막 날');
    const memo = screen.getByRole('textbox', { name: '10.14 1번째 사진 문장' });
    await user.clear(memo);
    await user.type(memo, '단풍이 예뻤다.');
    await user.click(screen.getByRole('button', { name: '완료' }));

    expect(updateTripStory).toHaveBeenCalledWith(
      9,
      {
        tone: 'EMOTIONAL',
        storySummary: '단풍 든 남산',
        blocks: [
          {
            storyBlockId: 99,
            tripAttachmentId: 42,
            dayLabel: '마지막 날',
            detailSummary: '남산 · 산책',
            memo: '단풍이 예뻤다.',
            orderNumber: 1,
          },
        ],
      },
      'csrf-token',
    );
    expect(await screen.findByText('단풍이 예뻤다.')).toBeInTheDocument();
    expect(screen.getByText('단풍 든 남산')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '스토리 편집' })).toBeInTheDocument();
  });

  it('필수 칸이 비면 바로 빨갛게 알리고, 완료를 누르면 그 칸으로 데려간다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '스토리 편집' }));
    const title = screen.getByRole('textbox', { name: '10.14 1번째 사진 제목' });
    expect(title).toBeRequired();
    expect(title).toHaveAttribute('placeholder', '사진 제목 (필수)');
    expect(screen.getByRole('textbox', { name: '10.14 1번째 사진 문장' })).not.toBeRequired();

    await user.clear(title);
    expect(title).toBeInvalid();
    expect(title).toHaveAccessibleDescription('필수 입력값입니다.');

    await user.click(screen.getByRole('button', { name: '완료' }));
    expect(updateTripStory).not.toHaveBeenCalled();
    expect(title).toHaveFocus();
  });

  it('사진을 빼면 남은 사진만 순서대로 보내고, 마지막 한 장은 뺄 수 없다', async () => {
    const user = userEvent.setup();
    const second = {
      ...response.days[0].blocks[0],
      storyBlockId: 100,
      orderNumber: 2,
      tripAttachmentId: 43,
      detailSummary: '남산 · 야경',
    };
    vi.mocked(getTripStory).mockResolvedValue({
      ...response,
      days: [{ ...response.days[0], blocks: [response.days[0].blocks[0], second] }],
    });
    vi.mocked(updateTripStory).mockResolvedValue({
      storyId: 9,
      tone: 'EMOTIONAL',
      storySummary: '서울의 가을',
      days: [{ ...response.days[0], blocks: [{ ...second, orderNumber: 1 }] }],
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: '스토리 편집' }));
    await user.click(screen.getByRole('button', { name: '10.14 1번째 사진 빼기' }));
    expect(screen.getByRole('button', { name: '10.14 1번째 사진 빼기' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '완료' }));

    expect(vi.mocked(updateTripStory).mock.calls[0][1].blocks).toEqual([
      expect.objectContaining({ storyBlockId: 100, tripAttachmentId: 43, orderNumber: 1 }),
    ]);
  });

  it('글 분위기를 바꾸면 미리보기 글로 바꾸고, 완료를 눌러야 저장한다', async () => {
    const user = userEvent.setup();
    vi.mocked(previewStoryTone).mockResolvedValue({
      storyId: 9,
      tone: 'HUMOROUS',
      storySummary: '남산에서 길 잃은 날',
      days: [
        {
          ...response.days[0],
          blocks: [{ ...response.days[0].blocks[0], memo: '케이블카보다 다리가 빨랐다.' }],
        },
      ],
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: '스토리 편집' }));
    await user.click(screen.getByRole('button', { name: '글 분위기 바꾸기, 지금은 감성적으로' }));
    await user.click(screen.getByRole('button', { name: /유쾌하게/ }));

    expect(previewStoryTone).toHaveBeenCalledWith(
      9,
      {
        tone: 'HUMOROUS',
        blocks: [
          {
            storyBlockId: 99,
            tripAttachmentId: 42,
            orderNumber: 1,
            dayLabel: '셋째 날 · 남산',
            detailSummary: '남산 · 산책',
            memo: '서울의 가을을 걸었다.',
          },
        ],
      },
      'csrf-token',
    );
    expect(await screen.findByRole('textbox', { name: '10.14 1번째 사진 문장' })).toHaveValue(
      '케이블카보다 다리가 빨랐다.',
    );
    expect(
      screen.getByRole('button', { name: '글 분위기 바꾸기, 지금은 유쾌하게' }),
    ).toBeInTheDocument();
    expect(updateTripStory).not.toHaveBeenCalled();
  });

  it('고친 내용이 있으면 나가기 전에 한 번 더 묻는다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '스토리 편집' }));
    await user.type(screen.getByRole('textbox', { name: '스토리 한 줄 요약' }), '!');
    await user.click(screen.getByRole('button', { name: '편집 그만하기' }));
    await user.click(screen.getByRole('button', { name: '그만하기' }));

    expect(await screen.findByText('서울의 가을')).toBeInTheDocument();
    expect(screen.queryByText('서울의 가을!')).not.toBeInTheDocument();
  });

  it('사진을 비슷한 사진으로 바꾸면 같은 블록에 새 사진 번호를 넣어 저장한다', async () => {
    const user = userEvent.setup();
    vi.mocked(getSimilarStoryPhotos).mockResolvedValue({
      sourceTripAttachmentId: 42,
      items: [
        { tripAttachmentId: 42, similarityScore: 1 },
        { tripAttachmentId: 51, similarityScore: 0.9 },
      ],
    });
    vi.mocked(getPlacePhotos).mockResolvedValue({
      photos: [
        { id: 42, thumbnailUrl: 'https://cdn.test/42.webp', accent: 'coast' },
        { id: 51, thumbnailUrl: 'https://cdn.test/51.webp', accent: 'night' },
      ],
      hasNext: false,
      nextCursor: null,
    });
    vi.mocked(updateTripStory).mockResolvedValue({
      storyId: 9,
      tone: 'EMOTIONAL',
      storySummary: '서울의 가을',
      days: response.days,
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: '스토리 편집' }));
    screen.getByRole('button', { name: '10.14 1번째 사진 비슷한 사진으로 바꾸기' }).focus();
    await user.keyboard('{Enter}');

    const dialog = await screen.findByRole('dialog', { name: '비슷한 사진으로 바꾸기' });
    // 이미 스토리에 들어간 사진(42)은 후보에서 뺍니다.
    const candidates = await within(dialog).findAllByRole('button', {
      name: /비슷한 사진 \d번째로 바꾸기/,
    });
    expect(candidates).toHaveLength(1);
    expect(getPlacePhotos).toHaveBeenCalledWith(7, 8, null);
    await user.click(candidates[0]);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '완료' }));
    expect(vi.mocked(updateTripStory).mock.calls[0][1].blocks).toEqual([
      expect.objectContaining({
        storyBlockId: 99,
        tripAttachmentId: 51,
        memo: '서울의 가을을 걸었다.',
      }),
    ]);
  });

  it('사진 사이에 같은 날 장소의 사진을 넣으면 새 사진으로 저장한다', async () => {
    const user = userEvent.setup();
    vi.mocked(getTripPlaceFolders).mockResolvedValue({
      folders: [{ id: 8, name: '남산', photoCount: 3, thumbnailUrl: null, accent: 'coast' }],
      hasNext: false,
      nextCursor: null,
    });
    vi.mocked(getPlacePhotos).mockResolvedValue({
      photos: [
        { id: 42, thumbnailUrl: 'https://cdn.test/42.webp', accent: 'coast' },
        { id: 60, thumbnailUrl: 'https://cdn.test/60.webp', accent: 'night' },
      ],
      hasNext: false,
      nextCursor: null,
    });
    vi.mocked(updateTripStory).mockResolvedValue({
      storyId: 9,
      tone: 'EMOTIONAL',
      storySummary: '서울의 가을',
      days: response.days,
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: '스토리 편집' }));
    await user.click(screen.getByRole('button', { name: '10.14 맨 앞에 사진 추가' }));
    const sheet = await screen.findByRole('dialog', { name: '사진 추가' });
    // 이미 스토리에 들어간 사진(42)은 빼고 보여줍니다.
    const candidates = await within(sheet).findAllByRole('button', {
      name: /남산 \d번째 사진 넣기/,
    });
    expect(candidates).toHaveLength(1);
    expect(getPlacePhotos).toHaveBeenCalledWith(7, 8, null, expect.anything());
    await user.click(candidates[0]);

    expect(screen.getByRole('textbox', { name: '10.14 1번째 사진 제목' })).toHaveValue('남산');
    await user.click(screen.getByRole('button', { name: '완료' }));
    expect(vi.mocked(updateTripStory).mock.calls[0][1].blocks).toEqual([
      expect.objectContaining({
        storyBlockId: null,
        tripAttachmentId: 60,
        orderNumber: 1,
        detailSummary: '남산',
      }),
      expect.objectContaining({ storyBlockId: 99, tripAttachmentId: 42, orderNumber: 2 }),
    ]);
  });
});
