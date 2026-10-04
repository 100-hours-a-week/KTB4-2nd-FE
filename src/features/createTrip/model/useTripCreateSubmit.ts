'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { createTripQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { EVENTS, track } from '@/shared/lib/analytics';
import { toast } from '@/shared/ui/toast';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
import { createTrip } from '../api/createTrip';
import {
  splitIntoUploadBatches,
  uploadInitialAttachmentBatch,
} from '../api/uploadInitialAttachments';
import {
  getTripProcessingStatus,
  type TripProcessingStatusResponse,
} from '../api/getTripProcessingStatus';
import { getTripRegion } from './getTripRegion';
import type { TripCreateFormValues } from './types';

function clampRatio(ratio: number) {
  return Math.min(Math.max(ratio, 0), 1);
}

function isSameAttachments(left: File[], right: File[]) {
  return left.length === right.length && left.every((file, index) => file === right[index]);
}

type UploadProgressPoint = { attachments: File[]; completedBatches: number };
type UploadAnalyticsPoint = {
  attachments: File[];
  elapsedMs: number;
  completed: boolean;
};
type GenerationAnalyticsPoint = {
  tripId: number;
  photoCount: number;
  startedAt: number;
  completed: boolean;
};

export function useTripCreateSubmit() {
  const createdTripId = useRef<number | null>(null);
  const uploadProgressPoint = useRef<UploadProgressPoint | null>(null);
  const uploadAnalyticsPoint = useRef<UploadAnalyticsPoint | null>(null);
  const uploadAbortController = useRef<AbortController | null>(null);
  const generationAnalyticsPoint = useRef<GenerationAnalyticsPoint | null>(null);
  const awaitingProcessingRef = useRef(false);
  const [tripId, setTripId] = useState<number | null>(null);
  const [uploadRatio, setUploadRatio] = useState(0);
  const [awaitingProcessing, setAwaitingProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<TripProcessingStatusResponse | null>(
    null,
  );

  // Batch 응답과 상태 조회 응답이 같은 완료를 알려도 한 여행에는 한 번만 기록한다.
  const finishProcessing = useCallback((status: TripProcessingStatusResponse) => {
    const generation = generationAnalyticsPoint.current;
    if (status.tripId !== createdTripId.current || status.status === 'PROCESSING') return;

    if (
      status.status === 'COMPLETED' &&
      status.result &&
      generation?.tripId === status.tripId &&
      !generation.completed
    ) {
      generation.completed = true;
      track(EVENTS.LOCATION_RESTORE_COMPLETE, {
        photo_count: generation.photoCount,
        restored_count: status.result.classifiedAttachmentCount,
        failed_count: status.result.unclassifiedAttachmentCount,
      });
      track(EVENTS.DIARY_GENERATE_COMPLETE, {
        photo_count: generation.photoCount,
        generation_time_sec: Math.round((Date.now() - generation.startedAt) / 1000),
      });
    }

    awaitingProcessingRef.current = false;
    setAwaitingProcessing(false);
    setProcessingResult(status);
  }, []);

  const mutation = useMutation({
    mutationFn: async (values: TripCreateFormValues) => {
      setUploadRatio(0);
      awaitingProcessingRef.current = false;
      setAwaitingProcessing(false);
      setProcessingResult(null);

      let currentTripId = createdTripId.current;

      if (currentTripId === null) {
        const createCsrfToken = await fetchCsrfToken();
        const trip = await createTrip(
          {
            tripName: values.tripName,
            startDate: values.startDate,
            endDate: values.endDate,
            regionCodes: values.places.map((place) => place.regionCode),
          },
          createCsrfToken,
        );
        currentTripId = trip.tripId;
        createdTripId.current = currentTripId;
        uploadProgressPoint.current = null;
        uploadAnalyticsPoint.current = null;
        generationAnalyticsPoint.current = null;
        setTripId(currentTripId);
        track(EVENTS.TRIP_CREATE, { trip_region: getTripRegion(values.places) });
      }

      const uploadCsrfToken = await fetchCsrfToken();
      const abortController = new AbortController();
      uploadAbortController.current = abortController;

      const batches = splitIntoUploadBatches(values.attachments);

      const resumePoint = uploadProgressPoint.current;
      const startIndex =
        resumePoint && isSameAttachments(resumePoint.attachments, values.attachments)
          ? Math.min(resumePoint.completedBatches, batches.length)
          : 0;

      let uploadAnalytics = uploadAnalyticsPoint.current;
      if (!uploadAnalytics || !isSameAttachments(uploadAnalytics.attachments, values.attachments)) {
        uploadAnalytics = {
          attachments: values.attachments,
          elapsedMs: 0,
          completed: false,
        };
        uploadAnalyticsPoint.current = uploadAnalytics;
        track(EVENTS.PHOTO_UPLOAD_START, { photo_count: values.attachments.length });
      }

      const uploadAttemptStartedAt = Date.now();

      setUploadRatio(batches.length === 0 ? 0 : startIndex / batches.length);

      try {
        let lastStatus: TripProcessingStatusResponse | null = null;

        for (let index = startIndex; index < batches.length; index += 1) {
          const isLastBatch = index === batches.length - 1;

          if (isLastBatch && !generationAnalyticsPoint.current?.completed) {
            generationAnalyticsPoint.current = {
              tripId: currentTripId,
              photoCount: values.attachments.length,
              startedAt: Date.now(),
              completed: false,
            };
          }

          const status = await uploadInitialAttachmentBatch({
            tripId: currentTripId,
            files: batches[index],
            batchNo: index + 1,
            totalAttachmentCount: values.attachments.length,
            complete: isLastBatch,
            csrfToken: uploadCsrfToken,
            onUploadProgress: (ratio) =>
              setUploadRatio((index + clampRatio(ratio)) / batches.length),
            signal: abortController.signal,
          });

          uploadProgressPoint.current = {
            attachments: values.attachments,
            completedBatches: index + 1,
          };

          if (status) lastStatus = status;
        }

        if (lastStatus === null) throw new Error('사진 업로드 결과를 받지 못했습니다.');

        uploadAnalytics.elapsedMs += Date.now() - uploadAttemptStartedAt;
        if (!uploadAnalytics.completed) {
          uploadAnalytics.completed = true;
          track(EVENTS.PHOTO_UPLOAD_COMPLETE, {
            photo_count: values.attachments.length,
            upload_duration_sec: Math.round(uploadAnalytics.elapsedMs / 1000),
          });
        }

        if (!abortController.signal.aborted && createdTripId.current === currentTripId) {
          setUploadRatio(1);
          if (lastStatus.status === 'PROCESSING') {
            awaitingProcessingRef.current = true;
            setAwaitingProcessing(true);
          } else {
            finishProcessing(lastStatus);
          }
        }

        return lastStatus;
      } catch (error) {
        uploadAnalytics.elapsedMs += Date.now() - uploadAttemptStartedAt;
        throw error;
      } finally {
        if (uploadAbortController.current === abortController) {
          uploadAbortController.current = null;
        }
      }
    },
  });

  const isPending = mutation.isPending || awaitingProcessing;
  const processingQuery = createTripQueries.processingStatus(tripId ?? 0);
  const processingStatus = useQuery({
    ...processingQuery,
    queryFn: async () => {
      // 마지막 Batch 응답 이후에 시작한 조회만 최종 결과로 사용한다.
      const canFinalize = awaitingProcessingRef.current;
      const generation = generationAnalyticsPoint.current;
      const status = await getTripProcessingStatus(tripId ?? 0);
      if (
        canFinalize &&
        awaitingProcessingRef.current &&
        generation === generationAnalyticsPoint.current
      ) {
        finishProcessing(status);
      }
      return status;
    },
    refetchInterval: (query) =>
      awaitingProcessing ? 2_000 : processingQuery.refetchInterval(query),
    enabled: isPending && tripId !== null && uploadRatio >= 1,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const currentTripId = createdTripId.current;
      if (currentTripId === null) return;

      const csrfToken = await fetchCsrfToken();
      await cancelTripProcessing(currentTripId, csrfToken);
    },
    onSuccess: () => {
      createdTripId.current = null;
      uploadProgressPoint.current = null;
      uploadAnalyticsPoint.current = null;
      generationAnalyticsPoint.current = null;
      setTripId(null);
      toast.success('여행 생성을 취소했어요.');
    },
    onError: () => {
      toast.error('여행 생성을 취소하지 못했어요. 잠시 후 다시 시도해주세요.');
    },
    onSettled: () => {
      setUploadRatio(0);
      mutation.reset();
    },
  });

  const { mutate: requestCancel } = cancelMutation;
  const cancelProcessing = useCallback(() => {
    awaitingProcessingRef.current = false;
    setAwaitingProcessing(false);
    setProcessingResult(null);
    uploadAbortController.current?.abort();
    uploadAbortController.current = null;
    requestCancel();
  }, [requestCancel]);

  const resetCreatedTrip = useCallback(() => {
    createdTripId.current = null;
    uploadProgressPoint.current = null;
    uploadAnalyticsPoint.current = null;
    generationAnalyticsPoint.current = null;
    awaitingProcessingRef.current = false;
    setAwaitingProcessing(false);
    setProcessingResult(null);
    setTripId(null);
  }, []);

  return {
    ...mutation,
    isPending,
    tripId,
    uploadRatio,
    processingStatus: processingStatus.data,
    processingResult,
    cancelProcessing,
    isCanceling: cancelMutation.isPending,
    resetCreatedTrip,
  };
}
