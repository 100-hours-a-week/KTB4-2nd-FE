import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getInvitedTrips } from '@/features/tripList/api/getInvitedTrips';
import { getTripShares } from '@/features/tripShare/api/getTripShares';

import { TripEditPage } from './tripEditPage';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/features/createTrip', () => ({
  TripEditForm: ({ tripId }: { tripId: number }) => <div>여행 {tripId} 수정 폼</div>,
}));
vi.mock('@/features/tripShare/api/getTripShares', () => ({ getTripShares: vi.fn() }));
vi.mock('@/features/tripList/api/getInvitedTrips', () => ({ getInvitedTrips: vi.fn() }));

function notFoundError() {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('not found', undefined, config, null, {
    status: 404,
    statusText: '',
    data: { message: 'TRIP_NOT_FOUND', data: null },
    headers: {},
    config,
  });
}

function sharedWith(permission: 'READ' | 'WRITE') {
  vi.mocked(getTripShares).mockRejectedValue(notFoundError());
  vi.mocked(getInvitedTrips).mockResolvedValue({
    trips: [
      {
        id: 7,
        name: '제주도 가을 여행',
        locations: [],
        startDate: '2025-10-12',
        endDate: '2025-10-14',
        nights: 2,
        photoCount: 3,
        favorite: false,
        processingStatus: 'ready',
        thumbnailUrl: null,
        permission,
      },
    ],
    totalCount: 1,
    hasNext: false,
    nextCursor: null,
  });
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TripEditPage tripId={7} initialStep="name" currentUserId={1} />
    </QueryClientProvider>,
  );
}

describe('TripEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTripShares).mockResolvedValue({ shares: [], nextCursor: null });
  });

  it('여행 주인이면 수정 폼을 보여준다', async () => {
    renderPage();

    expect(screen.getByText('여행 7 수정 폼')).toBeInTheDocument();
    await waitFor(() => expect(getTripShares).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
  });

  it('편집 권한으로 공유받은 여행이면 수정 폼을 그대로 보여준다', async () => {
    sharedWith('WRITE');
    renderPage();

    await waitFor(() => expect(getInvitedTrips).toHaveBeenCalled());
    expect(screen.getByText('여행 7 수정 폼')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('읽기 권한으로 공유받은 여행이면 주소로 들어와도 상세로 돌려보낸다', async () => {
    sharedWith('READ');
    renderPage();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips/7'));
    expect(screen.queryByText('여행 7 수정 폼')).not.toBeInTheDocument();
  });
});
