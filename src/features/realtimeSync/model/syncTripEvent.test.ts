import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invalidateTripData } from '@/queryFactory';

import { createTripEventFilter, syncTripEvent, tripEventsDestination } from './syncTripEvent';

vi.mock('@/queryFactory', () => ({ invalidateTripData: vi.fn(() => Promise.resolve()) }));

function tripEvent(eventId: string, sequence: number, message = 'TRIP_UPDATED') {
  return { message, data: { eventId, tripId: 7, sequence, requestId: 'req' } };
}

describe('createTripEventFilter', () => {
  it('같은 eventId가 다시 오면 무시한다', () => {
    const shouldHandle = createTripEventFilter();

    expect(shouldHandle(tripEvent('a', 1))).toBe(true);
    expect(shouldHandle(tripEvent('a', 1))).toBe(false);
  });

  it('이미 받은 것보다 낮은 sequence가 늦게 오면 무시하고, 같거나 높으면 처리한다', () => {
    const shouldHandle = createTripEventFilter();

    expect(shouldHandle(tripEvent('a', 5))).toBe(true);
    expect(shouldHandle(tripEvent('b', 4))).toBe(false);
    expect(shouldHandle(tripEvent('c', 5, 'TRIP_PHOTOS_DELETED'))).toBe(true);
    expect(shouldHandle(tripEvent('d', 8))).toBe(true);
  });

  it('eventId나 sequence가 없는 알림은 거르지 않는다', () => {
    const shouldHandle = createTripEventFilter();
    const withoutMeta = { message: 'TRIP_UPDATED', data: { tripId: 7 } };

    expect(shouldHandle(withoutMeta)).toBe(true);
    expect(shouldHandle(withoutMeta)).toBe(true);
  });
});

describe('syncTripEvent', () => {
  const client = new QueryClient();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('구독 주소는 여행별 이벤트 주소다', () => {
    expect(tripEventsDestination(7)).toBe('/topic/trips/7/events');
  });

  it('여행 수정·사진 삭제 알림이 오면 여행 데이터를 다시 받는다', () => {
    syncTripEvent(client, 7, tripEvent('a', 1, 'TRIP_UPDATED'));
    syncTripEvent(client, 7, tripEvent('b', 2, 'TRIP_PHOTOS_DELETED'));

    expect(invalidateTripData).toHaveBeenCalledTimes(2);
    expect(invalidateTripData).toHaveBeenCalledWith(client);
  });

  it('다른 여행의 알림이나 모르는 알림, 형식이 틀린 알림은 무시한다', () => {
    syncTripEvent(client, 8, tripEvent('a', 1));
    syncTripEvent(client, 7, tripEvent('b', 1, 'TRIP_SHARED'));
    syncTripEvent(client, 7, { message: 'TRIP_UPDATED', data: null });
    syncTripEvent(client, 7, undefined);

    expect(invalidateTripData).not.toHaveBeenCalled();
  });
});
