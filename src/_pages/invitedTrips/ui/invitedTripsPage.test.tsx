import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getInvitedTrips } from '@/features/tripList/api/getInvitedTrips';
import type { InvitedTripListItem } from '@/features/tripList/model/types';

import { InvitedTripsPage } from './invitedTripsPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/features/tripList/api/getInvitedTrips', () => ({ getInvitedTrips: vi.fn() }));

function trip(
  id: number,
  name: string,
  permission: InvitedTripListItem['permission'],
): InvitedTripListItem {
  return {
    id,
    name,
    locations: ['파리', '런던'],
    startDate: '2026-11-20',
    endDate: '2026-11-27',
    nights: 7,
    photoCount: 341,
    favorite: false,
    processingStatus: 'ready',
    thumbnailUrl: null,
    permission,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <InvitedTripsPage />
    </QueryClientProvider>,
  );
}

describe('InvitedTripsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getInvitedTrips).mockResolvedValue({
      trips: [trip(1, '파리 & 런던', 'READ'), trip(2, '제주 한 바퀴', 'WRITE')],
      totalCount: 2,
      hasNext: false,
      nextCursor: null,
    });
  });

  it('초대받은 여행을 전체 개수, 권한과 함께 보여주고 상세로 연결한다', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: '초대받은 폴더' })).toBeInTheDocument();
    expect(await screen.findByText('2개')).toBeInTheDocument();
    const list = screen.getByRole('region', { name: '초대받은 여행' });

    const items = within(list).getAllByRole('listitem');
    expect(within(items[0]).getByText('읽기 허용')).toBeInTheDocument();
    expect(within(items[1]).getByText('편집 허용')).toBeInTheDocument();
    expect(
      within(items[0]).getByRole('link', { name: '파리 & 런던 여행 상세 보기' }),
    ).toHaveAttribute('href', '/trips/1');
    expect(screen.queryByRole('button', { name: /즐겨찾기/ })).not.toBeInTheDocument();
  });

  it('다음 페이지가 있으면 이어서 모두 불러온다', async () => {
    vi.mocked(getInvitedTrips)
      .mockResolvedValueOnce({
        trips: [trip(1, '파리 & 런던', 'READ')],
        totalCount: 2,
        hasNext: true,
        nextCursor: 'next',
      })
      .mockResolvedValueOnce({
        trips: [trip(2, '제주 한 바퀴', 'WRITE')],
        totalCount: 2,
        hasNext: false,
        nextCursor: null,
      });

    renderPage();

    expect(await screen.findByText('제주 한 바퀴')).toBeInTheDocument();
    expect(getInvitedTrips).toHaveBeenLastCalledWith('next');
  });

  it('초대받은 여행이 없으면 빈 화면을 보여준다', async () => {
    vi.mocked(getInvitedTrips).mockResolvedValue({
      trips: [],
      totalCount: 0,
      hasNext: false,
      nextCursor: null,
    });

    renderPage();

    expect(await screen.findByText('초대받은 여행이 없어요')).toBeInTheDocument();
  });

  it('불러오지 못하면 다시 시도할 수 있다', async () => {
    vi.mocked(getInvitedTrips).mockRejectedValueOnce(new Error('failed'));
    renderPage();

    expect(await screen.findByText('초대받은 여행을 불러오지 못했어요.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('파리 & 런던')).toBeInTheDocument();
  });
});
