import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTripStory, type TripStoryResponse } from '@/features/tripStory';

import { TripStoryDetailPage } from './tripStoryDetailPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/features/tripStory/api/getTripStory', () => ({ getTripStory: vi.fn() }));
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
});
