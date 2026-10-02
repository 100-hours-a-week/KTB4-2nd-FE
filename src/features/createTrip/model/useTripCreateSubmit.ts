'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { fetchCsrfToken } from '@/shared/api/browser';
import { EVENTS, track } from '@/shared/lib/analytics';
import { toast } from '@/shared/ui/toast';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
import { createTrip } from '../api/createTrip';
import {
  splitIntoUploadBatches,
  uploadInitialAttachmentBatch,
} from '../api/uploadInitialAttachments';
import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';
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

export function useTripCreateSubmit() {
  const createdTripId = useRef<number | null>(null);
  const uploadProgressPoint = useRef<UploadProgressPoint | null>(null);
  const uploadAnalyticsPoint = useRef<UploadAnalyticsPoint | null>(null);
  const uploadAbortController = useRef<AbortController | null>(null);
  const [tripId, setTripId] = useState<number | null>(null);
  const [uploadRatio, setUploadRatio] = useState(0);

  const mutation = useMutation({
    mutationFn: async (values: TripCreateFormValues) => {
      setUploadRatio(0);

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

        if (lastStatus.status === 'COMPLETED' && lastStatus.result) {
          track(EVENTS.LOCATION_RESTORE_COMPLETE, {
            photo_count: values.attachments.length,
            restored_count: lastStatus.result.classifiedAttachmentCount,
            failed_count: lastStatus.result.unclassifiedAttachmentCount,
          });
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
    uploadAbortController.current?.abort();
    uploadAbortController.current = null;
    requestCancel();
  }, [requestCancel]);

  const resetCreatedTrip = useCallback(() => {
    createdTripId.current = null;
    uploadProgressPoint.current = null;
    uploadAnalyticsPoint.current = null;
    setTripId(null);
  }, []);

  return {
    ...mutation,
    tripId,
    uploadRatio,
    cancelProcessing,
    isCanceling: cancelMutation.isPending,
    resetCreatedTrip,
  };
}
