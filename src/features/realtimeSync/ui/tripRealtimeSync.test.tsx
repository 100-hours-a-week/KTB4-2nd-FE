import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTripSummary } from '@/features/tripDetail/api/fetchTripSummary';
import type { RealtimeSubscription } from '@/shared/api/realtime';

import { TripRealtimeSync } from './tripRealtimeSync';

const { subscriptions, unsubscribe } = vi.hoisted(() => ({
  subscriptions: [] as RealtimeSubscription[],
  unsubscribe: vi.fn(),
}));

vi.mock('@/features/tripDetail/api/fetchTripSummary', () => ({ fetchTripSummary: vi.fn() }));
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
});
