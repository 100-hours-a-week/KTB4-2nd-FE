import type { QueryClient } from '@tanstack/react-query';

import { invalidateTripData } from '@/queryFactory';

import { forgetOldest } from './aiTaskEventFilter';
import { isRecord } from './syncAiTaskMessage';

const TRIP_EVENT_MESSAGES = new Set(['TRIP_UPDATED', 'TRIP_PHOTOS_DELETED']);

export function tripEventsDestination(tripId: number) {
  return `/topic/trips/${tripId}/events`;
}

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

export function syncTripEvent(queryClient: QueryClient, tripId: number, body: unknown) {
  if (!isRecord(body) || !isRecord(body.data)) return;
  if (typeof body.message !== 'string' || !TRIP_EVENT_MESSAGES.has(body.message)) return;
  if (body.data.tripId !== tripId) return;

  void invalidateTripData(queryClient);
}
