'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { invalidateTripData, tripDetailQueries } from '@/queryFactory';
import {
  isRealtimeConnected,
  subscribeRealtime,
  subscribeRealtimeStatus,
} from '@/shared/api/realtime';

import {
  createTripEventFilter,
  syncTripEvent,
  tripEventsDestination,
} from '../model/syncTripEvent';

export function TripRealtimeSync({ tripId }: { tripId: number }) {
  const queryClient = useQueryClient();
  const { isSuccess } = useQuery(tripDetailQueries.summary(tripId));
  const [rejectedTripId, setRejectedTripId] = useState<number | null>(null);
  const canSubscribe = isSuccess && rejectedTripId !== tripId;

  useEffect(() => {
    if (!canSubscribe) return;

    let wasConnected = isRealtimeConnected();
    const unsubscribeStatus = subscribeRealtimeStatus(() => {
      const connected = isRealtimeConnected();
      if (connected === wasConnected) return;
      wasConnected = connected;
      if (connected) void invalidateTripData(queryClient);
    });
    const shouldHandle = createTripEventFilter();
    const unsubscribe = subscribeRealtime({
      destination: tripEventsDestination(tripId),
      onMessage: (body) => {
        if (shouldHandle(body)) syncTripEvent(queryClient, tripId, body);
      },
      onRejected: () => {
        setRejectedTripId(tripId);
        void invalidateTripData(queryClient);
      },
    });

    return () => {
      unsubscribeStatus();
      unsubscribe();
    };
  }, [canSubscribe, queryClient, tripId]);

  return null;
}
