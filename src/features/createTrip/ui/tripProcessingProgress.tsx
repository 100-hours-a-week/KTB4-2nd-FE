'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { createTripQueries, invalidateTripData, tripListQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
import { isTripProcessingRunning } from '../api/getTripProcessingStatus';
import {
  getPendingTripProcessingSnapshot,
  parsePendingTripProcessing,
  removePendingTripProcessing,
  subscribePendingTripProcessing,
} from '../model/pendingTripProcessing';
import { SharedTripPreparingView } from './components/sharedTripPreparingView';
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

function useProcessingMode(tripId: number) {
  const snapshot = useSyncExternalStore(
    subscribePendingTripProcessing,
    getPendingTripProcessingSnapshot,
    () => '',
  );
  const kind = parsePendingTripProcessing(snapshot).find((trip) => trip.tripId === tripId)?.kind;
  const [lastKind, setLastKind] = useState<TripFormMode | null>(null);
  if (kind && kind !== lastKind) setLastKind(kind);
  const mode: TripFormMode = kind ?? lastKind ?? 'create';
  /** 이 브라우저에서 시작한 작업인지입니다. */
  return { mode, startedHere: (kind ?? lastKind) !== null };
}

type TripProcessingProgressProps = {
  tripId: number;
};

export function TripProcessingProgress({ tripId }: TripProcessingProgressProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handled = useRef(false);
  const { mode, startedHere } = useProcessingMode(tripId);
  const { data, error } = useQuery(createTripQueries.processingStatus(tripId));
  // 정리 진행 상태는 주인만 볼 수 있어서(그 밖에는 404), 이 브라우저에서 시작하지 않은 작업이 404면 공유받은 사람입니다.
  const sharedWithMe = !startedHere && isAxiosError(error) && error.response?.status === 404;

  const cancel = useMutation({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken();
      await cancelTripProcessing(tripId, csrfToken);
    },
    onSuccess: () => {
      handled.current = true;
      removePendingTripProcessing(tripId);
      toast.success('여행 생성을 취소했어요.');
      void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
      router.replace('/trips');
    },
    onError: () => {
      toast.error('여행 생성을 취소하지 못했어요. 잠시 후 다시 시도해주세요.');
    },
  });

  useEffect(() => {
    if (handled.current || sharedWithMe) return;

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
  }, [data, error, mode, queryClient, router, sharedWithMe, tripId]);

  if (sharedWithMe) return <SharedTripPreparingView tripId={tripId} />;

  return (
    <TripFormModeContext.Provider value={mode}>
      <TripProcessingView
        uploadRatio={1}
        processingStatus={data}
        onContinueElsewhere={() => router.replace('/trips')}
        // 진행 상태를 받아 주인인 것이 확인된 뒤에만 취소할 수 있게 합니다.
        onCancel={mode === 'create' && data ? () => cancel.mutate() : undefined}
        isCanceling={cancel.isPending}
        cancelDescription="여행 생성을 취소하면 올린 사진은 저장되지 않고 여행 목록으로 돌아가요."
      />
    </TripFormModeContext.Provider>
  );
}
