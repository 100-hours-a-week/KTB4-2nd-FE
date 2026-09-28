'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
import { createTrip } from '../api/createTrip';
import {
  splitIntoUploadBatches,
  uploadInitialAttachmentBatch,
} from '../api/uploadInitialAttachments';
import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';
import type { TripCreateFormValues } from './types';

function clampRatio(ratio: number) {
  return Math.min(Math.max(ratio, 0), 1);
}

export function useTripCreateSubmit() {
  const createdTripId = useRef<number | null>(null);
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
        setTripId(currentTripId);
      }

      const uploadCsrfToken = await fetchCsrfToken();
      const abortController = new AbortController();
      uploadAbortController.current = abortController;

      // 사진은 10장씩 나눠 보내고, 마지막 묶음에서만 처리 상태가 돌아옵니다.
      const batches = splitIntoUploadBatches(values.attachments);

      try {
        let lastStatus: TripProcessingStatusResponse | null = null;

        for (const [index, batch] of batches.entries()) {
          const isLastBatch = index === batches.length - 1;

          const status = await uploadInitialAttachmentBatch({
            tripId: currentTripId,
            files: batch,
            batchNo: index + 1,
            totalAttachmentCount: values.attachments.length,
            complete: isLastBatch,
            csrfToken: uploadCsrfToken,
            // 묶음마다 0~1이 반복되므로 전체 묶음 수로 나눠 한 줄기로 이어 붙입니다.
            onUploadProgress: (ratio) =>
              setUploadRatio((index + clampRatio(ratio)) / batches.length),
            signal: abortController.signal,
          });

          if (status) lastStatus = status;
        }

        if (lastStatus === null) throw new Error('사진 업로드 결과를 받지 못했습니다.');

        return lastStatus;
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
