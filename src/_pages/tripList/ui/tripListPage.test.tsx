import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTrips } from '@/features/tripList/api/getTrips';
import type { TripListPageResult } from '@/features/tripList/api/getTrips';
import { registerTripFavorite, removeTripFavorite } from '@/features/tripList/api/tripFavorite';
import type { TripListItem } from '@/features/tripList/model/types';

import { TripListPage } from './tripListPage';

vi.mock('@/features/tripList/api/getTrips', () => ({ getTrips: vi.fn() }));
vi.mock('@/features/tripList/api/tripFavorite', () => ({
  registerTripFavorite: vi.fn(),
  removeTripFavorite: vi.fn(),
}));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));

function trip(overrides: Partial<TripListItem> & Pick<TripListItem, 'id' | 'name'>): TripListItem {
  return {
    locations: ['제주시'],
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    nights: 2,
    photoCount: 12,
    favorite: false,
    processingStatus: 'ready',
    thumbnailUrl: null,
    ...overrides,
  };
}

const trips = [
  trip({
    id: 1,
    name: '파리 & 런던',
    locations: ['파리', '런던'],
    favorite: true,
    photoCount: 341,
  }),
  trip({ id: 2, name: '이천 가을 여행', favorite: true }),
  trip({ id: 3, name: '제주 한 바퀴' }),
];

function page(items: TripListItem[]): TripListPageResult {
  return { trips: items, hasNext: false, nextCursor: null };
}

function renderTripListPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TripListPage />
    </QueryClientProvider>,
  );
}

describe('TripListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTrips).mockResolvedValue(page(trips));
  });

  it('목록 API로 받은 여행 수와 카드 정보를 표시한다', async () => {
    renderTripListPage();

    expect(screen.getByRole('heading', { name: '나의 여행 목록' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '파리 & 런던' })).toBeInTheDocument();
    expect(screen.getByText(/지금까지/).parentElement).toHaveTextContent(
      '3개의 여행을 기록했어요.',
    );
    expect(screen.getByText('파리, 런던')).toBeInTheDocument();
    expect(screen.getByText(/사진 341장/)).toBeInTheDocument();
    expect(getTrips).toHaveBeenCalledWith({ sort: 'LATEST', favorite: false, cursor: null });
  });

  it('즐겨찾기만 보기를 켜면 favorite=true로 요청하고 즐겨찾기한 여행만 표시한다', async () => {
    renderTripListPage();
    await screen.findByRole('heading', { name: '파리 & 런던' });

    await userEvent.click(screen.getByRole('switch', { name: '즐겨찾기만 보기' }));

    await waitFor(() =>
      expect(getTrips).toHaveBeenCalledWith({ sort: 'LATEST', favorite: true, cursor: null }),
    );
    expect(await screen.findByRole('heading', { name: '이천 가을 여행' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '제주 한 바퀴' })).not.toBeInTheDocument();
  });

  it('정렬 기준을 오래된순으로 바꾸면 sort=OLDEST로 다시 요청한다', async () => {
    renderTripListPage();
    await screen.findByRole('heading', { name: '파리 & 런던' });

    await userEvent.click(screen.getByRole('combobox', { name: '여행 정렬' }));
    await userEvent.click(screen.getByRole('option', { name: '오래된순' }));

    await waitFor(() =>
      expect(getTrips).toHaveBeenCalledWith({ sort: 'OLDEST', favorite: false, cursor: null }),
    );
  });

  it('응답 순서대로 즐겨찾기 그룹과 전체 그룹을 나눠 보여준다', async () => {
    renderTripListPage();
    await screen.findByRole('heading', { name: '파리 & 런던' });

    const favoriteGroup = screen.getByRole('region', { name: '여행' });
    const allTrips = screen.getByRole('region', { name: '전체 여행' });
    expect(within(favoriteGroup).getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(within(allTrips).getByRole('heading', { level: 3 })).toHaveTextContent('제주 한 바퀴');
  });

  it('즐겨찾기를 추가하면 등록 API를 호출하고 별을 즉시 채운다', async () => {
    vi.mocked(registerTripFavorite).mockResolvedValue({ tripId: 3, isFavorite: true });
    renderTripListPage();
    await screen.findByRole('heading', { name: '제주 한 바퀴' });

    await userEvent.click(screen.getByRole('button', { name: '제주 한 바퀴 즐겨찾기 추가' }));

    expect(registerTripFavorite).toHaveBeenCalledWith(3, 'csrf-token');
    expect(
      await screen.findByRole('button', { name: '제주 한 바퀴 즐겨찾기 해제' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('즐겨찾기를 해제하면 해제 API를 호출한다', async () => {
    vi.mocked(removeTripFavorite).mockResolvedValue(undefined);
    renderTripListPage();
    await screen.findByRole('heading', { name: '파리 & 런던' });

    await userEvent.click(screen.getByRole('button', { name: '파리 & 런던 즐겨찾기 해제' }));

    expect(removeTripFavorite).toHaveBeenCalledWith(1, 'csrf-token');
  });

  it('즐겨찾기 변경이 실패하면 이전 상태로 되돌린다', async () => {
    vi.mocked(removeTripFavorite).mockRejectedValue(new Error('failed'));
    renderTripListPage();
    await screen.findByRole('heading', { name: '파리 & 런던' });

    await userEvent.click(screen.getByRole('button', { name: '파리 & 런던 즐겨찾기 해제' }));

    expect(
      await screen.findByRole('button', { name: '파리 & 런던 즐겨찾기 해제' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('여행이 없으면 첫 여행 만들기 안내를 표시한다', async () => {
    vi.mocked(getTrips).mockResolvedValue(page([]));
    renderTripListPage();

    expect(await screen.findByText('아직 기록된 여행이 없어요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /첫 여행 만들기/ })).toHaveAttribute(
      'href',
      '/trips/create?step=name',
    );
  });

  it('불러오기에 실패하면 스켈레톤과 다시 시도 동작을 제공한다', async () => {
    vi.mocked(getTrips).mockRejectedValue(new Error('failed'));
    renderTripListPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('여행을 가져오지 못했어요.');
    expect(screen.getByRole('status', { name: '여행 목록 불러오는 중' })).toBeInTheDocument();

    vi.mocked(getTrips).mockResolvedValue(page(trips));
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('heading', { name: '파리 & 런던' })).toBeInTheDocument();
  });

  it('다음 커서가 있으면 이어서 모두 불러온다', async () => {
    vi.mocked(getTrips)
      .mockResolvedValueOnce({ trips: trips.slice(0, 2), hasNext: true, nextCursor: 'cursor-2' })
      .mockResolvedValueOnce(page(trips.slice(2)));
    renderTripListPage();

    expect(await screen.findByRole('heading', { name: '제주 한 바퀴' })).toBeInTheDocument();
    expect(getTrips).toHaveBeenLastCalledWith({
      sort: 'LATEST',
      favorite: false,
      cursor: 'cursor-2',
    });
    expect(screen.getByText(/지금까지/).parentElement).toHaveTextContent(
      '3개의 여행을 기록했어요.',
    );
  });
});
