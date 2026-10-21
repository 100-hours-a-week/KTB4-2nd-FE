'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import {
  createTripQueries,
  mainMapQueries,
  photoListQueries,
  tripDetailQueries,
  tripListQueries,
} from '@/queryFactory';
import { toast } from '@/shared/ui/toast';

import { isTripProcessingRunning } from '../api/getTripProcessingStatus';
import { removePendingTripProcessing } from '../model/pendingTripProcessing';
import { TripProcessingView } from './components/tripProcessingView';

type TripProcessingProgressProps = {
  tripId: number;
};

export function TripProcessingProgress({ tripId }: TripProcessingProgressProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handled = useRef(false);
  const { data, error } = useQuery(createTripQueries.processingStatus(tripId));

  useEffect(() => {
    if (handled.current) return;

    const gone = isAxiosError(error) && error.response?.status === 404;
    if (!gone && (!data || isTripProcessingRunning(data.status))) return;

    handled.current = true;
    removePendingTripProcessing(tripId);

    if (data?.status === 'COMPLETED') {
      toast.success('여행을 만들었어요. 장소별로 사진을 정리했어요.');
      void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
      void queryClient.invalidateQueries({ queryKey: mainMapQueries.markers().queryKey });
      void queryClient.invalidateQueries({ queryKey: tripDetailQueries.allKeys() });
      void queryClient.invalidateQueries({ queryKey: photoListQueries.allKeys() });
      router.replace(`/trips/${tripId}`);
      return;
    }

    if (data?.status === 'FAILED') {
      toast.error('사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
    void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
    router.replace('/trips');
  }, [data, error, queryClient, router, tripId]);

  return (
    <TripProcessingView
      uploadRatio={1}
      processingStatus={data}
      onContinueElsewhere={() => router.replace('/trips')}
    />
  );
}
