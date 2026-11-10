'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { invalidateTripData, tripDetailQueries } from '@/queryFactory';
import {
  isRealtimeConnected,
  subscribeRealtime,
  subscribeRealtimeStatus,
} from '@/shared/api/realtime';
import { toast } from '@/shared/ui/toast';

import {
  createTripEventFilter,
  syncTripEvent,
  tripEventsDestination,
} from '../model/syncTripEvent';
import { getTripEditNotice, isOwnTripEditRequest } from '../model/tripEditNotice';
import { isRecord } from '../model/syncAiTaskMessage';

/** 여행 안의 어느 화면에 있든 다른 사람이 바꾼 내용을 알려줍니다. 내가 저장해서 생긴 알림은 띄우지 않습니다. */
function notifyOthersChange(tripId: number, body: unknown) {
  if (!isRecord(body) || !isRecord(body.data)) return;
  if (body.data.tripId !== tripId || isOwnTripEditRequest(body.data.requestId)) return;

  const notice = getTripEditNotice(body);
  if (notice) toast.info(notice);
}

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
        if (!shouldHandle(body)) return;
        syncTripEvent(queryClient, tripId, body);
        notifyOthersChange(tripId, body);
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
