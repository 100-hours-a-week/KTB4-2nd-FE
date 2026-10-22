'use client';

import { useQueries, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { createTripQueries, invalidateTripData } from '@/queryFactory';
import { toast } from '@/shared/ui/toast';

import { getTripProcessingStatus, isTripProcessingRunning } from '../api/getTripProcessingStatus';
import {
  getPendingTripProcessingKey,
  getPendingTripProcessingSnapshot,
  parsePendingTripProcessing,
  removePendingTripProcessing,
  subscribePendingTripProcessing,
  type PendingTrip,
} from '../model/pendingTripProcessing';

const POLLING_MS = 2_000;

const COMPLETED_MESSAGE: Record<PendingTrip['kind'], string> = {
  create: '여행을 만들었어요. 장소별로 사진을 정리했어요.',
  edit: '추가한 사진을 장소별로 정리했어요.',
};
const FAILED_MESSAGE: Record<PendingTrip['kind'], string> = {
  create: '사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.',
  edit: '추가한 사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.',
};

function backgroundStatusKey(trip: PendingTrip) {
  return [
    ...createTripQueries.processingStatusKeys(trip.tripId),
    'background',
    trip.startedAt,
  ] as const;
}

function isHandledByCurrentPage(trip: PendingTrip, pathname: string) {
  if (pathname === `/trips/${trip.tripId}/processing`) return true;
  return trip.kind === 'create'
    ? pathname === '/trips/create'
    : pathname === `/trips/${trip.tripId}/edit`;
}

export function TripProcessingWatcher() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const handled = useRef(new Set<string>());
  const snapshot = useSyncExternalStore(
    subscribePendingTripProcessing,
    getPendingTripProcessingSnapshot,
    () => '',
  );
  const trips = useMemo(
    () =>
      parsePendingTripProcessing(snapshot).filter(
        (trip) => !isHandledByCurrentPage(trip, pathname),
      ),
    [pathname, snapshot],
  );
  const results = useQueries({
    queries: trips.map((trip) => ({
      queryKey: backgroundStatusKey(trip),
      queryFn: () => getTripProcessingStatus(trip.tripId),
      refetchInterval: POLLING_MS,
    })),
  });

  useEffect(() => {
    trips.forEach((trip, index) => {
      const { data, error } = results[index] ?? {};
      const handledKey = getPendingTripProcessingKey(trip);
      if (handled.current.has(handledKey)) return;

      const gone = isAxiosError(error) && error.response?.status === 404;
      if (!gone && (!data || isTripProcessingRunning(data.status))) return;

      handled.current.add(handledKey);
      removePendingTripProcessing(trip.tripId, trip.startedAt);
      if (gone) return;

      if (data?.status === 'COMPLETED') {
        toast.success(COMPLETED_MESSAGE[trip.kind]);
        void invalidateTripData(queryClient);
      } else if (data?.status === 'FAILED') {
        toast.error(FAILED_MESSAGE[trip.kind]);
      }
    });
  }, [queryClient, results, trips]);

  return null;
}
