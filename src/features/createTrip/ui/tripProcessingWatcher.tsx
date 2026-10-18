'use client';

import { useQueries, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import {
  createTripQueries,
  mainMapQueries,
  photoListQueries,
  tripDetailQueries,
  tripListQueries,
} from '@/queryFactory';
import { toast } from '@/shared/ui/toast';

import { getTripProcessingStatus, isTripProcessingRunning } from '../api/getTripProcessingStatus';
import {
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

/** 만들기·수정 화면에 있으면 그 화면이 직접 결과를 보여주므로 여기서는 확인하지 않습니다. */
function isHandledByCurrentPage(trip: PendingTrip, pathname: string) {
  return trip.kind === 'create'
    ? pathname === '/trips/create'
    : pathname === `/trips/${trip.tripId}/edit`;
}

/**
 * 여행 만들기·수정 화면을 나가도 사진 정리를 계속 확인하고, 끝나면 어느 화면에서든 토스트로 알립니다.
 */
export function TripProcessingWatcher() {
  const router = useRouter();
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
      // 만들기 화면의 상태 조회는 결과 처리를 함께 하므로 같은 캐시를 쓰지 않도록 키를 나눕니다.
      queryKey: [...createTripQueries.processingStatusKeys(trip.tripId), 'background'],
      queryFn: () => getTripProcessingStatus(trip.tripId),
      refetchInterval: POLLING_MS,
    })),
  });

  useEffect(() => {
    trips.forEach((trip, index) => {
      const { data, error } = results[index] ?? {};
      const handledKey = `${trip.kind}:${trip.tripId}`;
      if (handled.current.has(handledKey)) return;

      const gone = isAxiosError(error) && error.response?.status === 404;
      if (!gone && (!data || isTripProcessingRunning(data.status))) return;

      handled.current.add(handledKey);
      removePendingTripProcessing(trip.tripId);
      if (gone) return;

      if (data?.status === 'COMPLETED') {
        toast.success(COMPLETED_MESSAGE[trip.kind], { duration: 5000 });
        void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
        void queryClient.invalidateQueries({ queryKey: mainMapQueries.markers().queryKey });
        void queryClient.invalidateQueries({ queryKey: tripDetailQueries.allKeys() });
        void queryClient.invalidateQueries({ queryKey: photoListQueries.allKeys() });
        router.refresh();
      } else if (data?.status === 'FAILED') {
        toast.error(FAILED_MESSAGE[trip.kind], { duration: 5000 });
      }
    });
  }, [queryClient, results, router, trips]);

  return null;
}
