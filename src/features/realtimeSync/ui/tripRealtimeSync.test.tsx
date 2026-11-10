import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTripSummary } from '@/features/tripDetail/api/fetchTripSummary';
import type { RealtimeSubscription } from '@/shared/api/realtime';
import { toast } from '@/shared/ui/toast';

import { rememberOwnTripEditRequest } from '../model/tripEditNotice';

import { TripRealtimeSync } from './tripRealtimeSync';

const { subscriptions, unsubscribe } = vi.hoisted(() => ({
  subscriptions: [] as RealtimeSubscription[],
  unsubscribe: vi.fn(),
}));

vi.mock('@/features/tripDetail/api/fetchTripSummary', () => ({ fetchTripSummary: vi.fn() }));
vi.mock('@/shared/ui/toast', () => ({ toast: { info: vi.fn() } }));
vi.mock('@/shared/api/realtime', () => ({
  isRealtimeConnected: () => true,
  subscribeRealtimeStatus: () => () => {},
  subscribeRealtime: (subscription: RealtimeSubscription) => {
    subscriptions.push(subscription);
    return unsubscribe;
  },
}));

function renderSync(tripId = 7) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const view = render(
    <QueryClientProvider client={client}>
      <TripRealtimeSync tripId={tripId} />
    </QueryClientProvider>,
  );
  return { ...view, invalidate };
}

describe('TripRealtimeSync', () => {
  beforeEach(() => {
    subscriptions.length = 0;
    vi.clearAllMocks();
  });

  it('여행을 볼 수 있는 것이 확인되면 그 여행의 이벤트를 구독하고, 화면을 벗어나면 해제한다', async () => {
    vi.mocked(fetchTripSummary).mockResolvedValue({} as never);
    const { unmount } = renderSync();

    await waitFor(() => expect(subscriptions).toHaveLength(1));
    expect(subscriptions[0].destination).toBe('/topic/trips/7/events');

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('여행을 불러오지 못하면 구독하지 않는다', async () => {
    vi.mocked(fetchTripSummary).mockRejectedValue(new Error('forbidden'));
    renderSync();

    await waitFor(() => expect(fetchTripSummary).toHaveBeenCalled());
    await act(async () => {});
    expect(subscriptions).toHaveLength(0);
  });

  it('알림이 오면 여행 데이터를 다시 받고, 같은 알림은 한 번만 처리한다', async () => {
    vi.mocked(fetchTripSummary).mockResolvedValue({} as never);
    const { invalidate } = renderSync();
    await waitFor(() => expect(subscriptions).toHaveLength(1));
    invalidate.mockClear();

    const event = { message: 'TRIP_UPDATED', data: { eventId: 'a', tripId: 7, sequence: 3 } };
    act(() => subscriptions[0].onMessage(event));
    const calls = invalidate.mock.calls.length;
    expect(calls).toBeGreaterThan(0);

    act(() => subscriptions[0].onMessage(event));
    expect(invalidate).toHaveBeenCalledTimes(calls);
  });

  it('구독이 거절되면 다시 구독하지 않는다', async () => {
    vi.mocked(fetchTripSummary).mockResolvedValue({} as never);
    renderSync();
    await waitFor(() => expect(subscriptions).toHaveLength(1));

    act(() => subscriptions[0].onRejected?.());

    await act(async () => {});
    expect(subscriptions).toHaveLength(1);
  });

  it('다른 사람이 바꾸면 어느 화면에서든 알려주고, 수정 화면 데이터도 다시 받는다', async () => {
    vi.mocked(fetchTripSummary).mockResolvedValue({} as never);
    const { invalidate } = renderSync();
    await waitFor(() => expect(subscriptions).toHaveLength(1));

    act(() =>
      subscriptions[0].onMessage({
        message: 'TRIP_UPDATED',
        data: { eventId: 'b', requestId: 'other', tripId: 7, changes: { tripName: '부산' } },
      }),
    );
    act(() =>
      subscriptions[0].onMessage({
        message: 'TRIP_PHOTOS_DELETED',
        data: { eventId: 'c', requestId: 'other', tripId: 7, attachmentCount: 2 },
      }),
    );

    expect(toast.info).toHaveBeenCalledWith('여행 이름이 바뀌었어요.');
    expect(toast.info).toHaveBeenCalledWith('사진 2장이 지워졌어요.');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['createTrip', 'edit', 7] });
  });

  it('내가 보낸 명령으로 생긴 알림이나 다른 여행의 알림은 띄우지 않는다', async () => {
    vi.mocked(fetchTripSummary).mockResolvedValue({} as never);
    renderSync();
    await waitFor(() => expect(subscriptions).toHaveLength(1));
    rememberOwnTripEditRequest('mine');

    act(() =>
      subscriptions[0].onMessage({
        message: 'TRIP_UPDATED',
        data: { eventId: 'd', requestId: 'mine', tripId: 7, changes: { tripName: '부산' } },
      }),
    );
    act(() =>
      subscriptions[0].onMessage({
        message: 'TRIP_UPDATED',
        data: { eventId: 'e', requestId: 'other', tripId: 8, changes: { tripName: '부산' } },
      }),
    );

    expect(toast.info).not.toHaveBeenCalled();
  });
});
