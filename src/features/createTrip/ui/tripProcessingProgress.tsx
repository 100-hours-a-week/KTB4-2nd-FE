'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { createTripQueries, invalidateTripData, tripListQueries } from '@/queryFactory';
import { toast } from '@/shared/ui/toast';

import { isTripProcessingRunning } from '../api/getTripProcessingStatus';
import {
  getPendingTripProcessingSnapshot,
  parsePendingTripProcessing,
  removePendingTripProcessing,
  subscribePendingTripProcessing,
} from '../model/pendingTripProcessing';
import { type TripFormMode, TripFormModeContext } from './components/tripFormMode';
import { TripProcessingView } from './components/tripProcessingView';

const COMPLETED_MESSAGE: Record<TripFormMode, string> = {
  create: '여행을 만들었어요. 장소별로 사진을 정리했어요.',
  edit: '추가한 사진을 장소별로 정리했어요.',
};
const FAILED_MESSAGE: Record<TripFormMode, string> = {
  create: '사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.',
  edit: '추가한 사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.',
};

function useProcessingMode(tripId: number): TripFormMode {
  const snapshot = useSyncExternalStore(
    subscribePendingTripProcessing,
    getPendingTripProcessingSnapshot,
    () => '',
  );
  const kind = parsePendingTripProcessing(snapshot).find((trip) => trip.tripId === tripId)?.kind;
  const [lastKind, setLastKind] = useState<TripFormMode | null>(null);
  if (kind && kind !== lastKind) setLastKind(kind);
  return kind ?? lastKind ?? 'create';
}

type TripProcessingProgressProps = {
  tripId: number;
};

export function TripProcessingProgress({ tripId }: TripProcessingProgressProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handled = useRef(false);
  const mode = useProcessingMode(tripId);
  const { data, error } = useQuery(createTripQueries.processingStatus(tripId));

  useEffect(() => {
    if (handled.current) return;

    const gone = isAxiosError(error) && error.response?.status === 404;
    if (!gone && (!data || isTripProcessingRunning(data.status))) return;

    handled.current = true;
    removePendingTripProcessing(tripId);

    if (data?.status === 'COMPLETED') {
      toast.success(COMPLETED_MESSAGE[mode]);
      void invalidateTripData(queryClient);
      router.replace(`/trips/${tripId}`);
      return;
    }

    if (data?.status === 'FAILED') {
      toast.error(FAILED_MESSAGE[mode]);
    }
    void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
    router.replace('/trips');
  }, [data, error, mode, queryClient, router, tripId]);

  return (
    <TripFormModeContext.Provider value={mode}>
      <TripProcessingView
        uploadRatio={1}
        processingStatus={data}
        onContinueElsewhere={() => router.replace('/trips')}
      />
    </TripFormModeContext.Provider>
  );
}
