import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyTripPermission } from '@/features/tripShare/api/getMyTripPermission';

import { TripEditPage } from './tripEditPage';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/features/createTrip', () => ({
  TripEditForm: ({ tripId, realtimeOnly }: { tripId: number; realtimeOnly?: boolean }) => (
    <div>
      여행 {tripId} 수정 폼{realtimeOnly ? ' (웹소켓 전용)' : ''}
    </div>
  ),
}));
vi.mock('@/features/tripShare/api/getMyTripPermission', () => ({
  getMyTripPermission: vi.fn(),
}));

function sharedWith(permission: 'READ' | 'WRITE') {
  vi.mocked(getMyTripPermission).mockResolvedValue(permission);
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TripEditPage tripId={7} initialStep="name" />
    </QueryClientProvider>,
  );
}

describe('TripEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyTripPermission).mockResolvedValue('OWNER');
  });

  it('여행 주인이면 수정 폼을 보여준다', async () => {
    renderPage();

    expect(await screen.findByText('여행 7 수정 폼')).toBeInTheDocument();
    expect(getMyTripPermission).toHaveBeenCalledWith(7);
    expect(replace).not.toHaveBeenCalled();
  });

  it('편집 권한으로 공유받은 여행이면 수정 폼을 보여주고 저장은 웹소켓으로만 보내게 한다', async () => {
    sharedWith('WRITE');
    renderPage();

    await waitFor(() => expect(getMyTripPermission).toHaveBeenCalledWith(7));
    expect(await screen.findByText('여행 7 수정 폼 (웹소켓 전용)')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('읽기 권한으로 공유받은 여행이면 주소로 들어와도 상세로 돌려보낸다', async () => {
    sharedWith('READ');
    renderPage();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips/7'));
    expect(screen.queryByText('여행 7 수정 폼')).not.toBeInTheDocument();
  });
});
