import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTrips } from '@/features/tripList/api/getTrips';
import { removeTripFavorite } from '@/features/tripList/api/tripFavorite';
import type { TripListItem } from '@/features/tripList/model/types';

import { FavoriteTripsPage } from './favoriteTripsPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/features/tripList/api/getTrips', () => ({ getTrips: vi.fn() }));
vi.mock('@/features/tripList/api/tripFavorite', () => ({
  registerTripFavorite: vi.fn(),
  removeTripFavorite: vi.fn(),
}));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));

function trip(id: number, name: string): TripListItem {
  return {
    id,
    name,
    locations: ['제주시'],
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    nights: 2,
    photoCount: 12,
    favorite: true,
    processingStatus: 'ready',
    thumbnailUrl: null,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <FavoriteTripsPage />
    </QueryClientProvider>,
  );
}

describe('FavoriteTripsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTrips).mockResolvedValue({
      trips: [trip(1, '파리 & 런던'), trip(2, '제주 한 바퀴')],
      hasNext: false,
      nextCursor: null,
    });
    vi.mocked(removeTripFavorite).mockResolvedValue(undefined);
  });

  it('즐겨찾기한 여행만 요청해 개수와 함께 보여준다', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: '파리 & 런던' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '제주 한 바퀴' })).toBeInTheDocument();
    expect(getTrips).toHaveBeenCalledWith({ sort: 'LATEST', favorite: true, cursor: null });
    expect(screen.getByText('2개')).toBeInTheDocument();
  });

  it('별을 누르면 즐겨찾기를 해제하고 목록에서 바로 뺀다', async () => {
    renderPage();
    await screen.findByRole('heading', { name: '파리 & 런던' });

    await userEvent.click(screen.getByRole('button', { name: '파리 & 런던 즐겨찾기 해제' }));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: '파리 & 런던' })).not.toBeInTheDocument(),
    );
    expect(removeTripFavorite).toHaveBeenCalledWith(1, 'csrf-token');
  });

  it('즐겨찾기한 여행이 없으면 여행 목록으로 안내한다', async () => {
    vi.mocked(getTrips).mockResolvedValue({ trips: [], hasNext: false, nextCursor: null });
    renderPage();

    expect(
      await screen.findByRole('heading', { name: '즐겨찾기한 여행이 없어요' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '여행 목록 보기' })).toHaveAttribute('href', '/trips');
  });
});
