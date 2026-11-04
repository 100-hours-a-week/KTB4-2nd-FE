import type { QueryClient } from '@tanstack/react-query';

import { invalidateTripData } from '@/queryFactory';

import { forgetOldest } from './aiTaskEventFilter';
import { isRecord } from './syncAiTaskMessage';

const TRIP_EVENT_MESSAGES = new Set(['TRIP_UPDATED', 'TRIP_PHOTOS_DELETED']);

export function tripEventsDestination(tripId: number) {
  return `/topic/trips/${tripId}/events`;
}

/**
 * 같은 `eventId`가 다시 오거나, 이미 받은 것보다 낮은 `sequence`가 늦게 오면 무시합니다.
 * `sequence`는 여행이 바뀔 때마다 커지는 값이라 여행 하나 안에서만 비교합니다.
 */
export function createTripEventFilter() {
  const seenEventIds = new Set<string>();
  let latestSequence: number | null = null;

  return function shouldHandle(body: unknown) {
    if (!isRecord(body) || !isRecord(body.data)) return true;
    const { data } = body;

    if (typeof data.eventId === 'string') {
      if (seenEventIds.has(data.eventId)) return false;
      seenEventIds.add(data.eventId);
      forgetOldest(seenEventIds);
    }

    if (typeof data.sequence === 'number') {
      if (latestSequence !== null && data.sequence < latestSequence) return false;
      latestSequence = data.sequence;
    }

    return true;
  };
}

/** 다른 사람이 여행을 고치거나 사진을 지우면 이 여행과 관련된 화면 데이터를 다시 받습니다. */
export function syncTripEvent(queryClient: QueryClient, tripId: number, body: unknown) {
  if (!isRecord(body) || !isRecord(body.data)) return;
  if (typeof body.message !== 'string' || !TRIP_EVENT_MESSAGES.has(body.message)) return;
  if (body.data.tripId !== tripId) return;

  void invalidateTripData(queryClient);
}
