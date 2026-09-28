'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
import { createTrip } from '../api/createTrip';
import { uploadInitialAttachments } from '../api/uploadInitialAttachments';
import type { TripCreateFormValues } from './types';

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

      try {
        return await uploadInitialAttachments(
          currentTripId,
          values.attachments,
          uploadCsrfToken,
          setUploadRatio,
          abortController.signal,
        );
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
      // 취소된 여행은 CANCELED가 되어 재업로드가 막히므로 다음 시도는 새 여행으로 만듭니다.
      createdTripId.current = null;
      setTripId(null);
      toast.success('여행 생성을 취소했어요.');
    },
    onError: () => {
      // 취소가 실패하면 여행이 아직 PROCESSING일 수 있어 ID를 남겨 재업로드가 되게 둡니다.
      toast.error('여행 생성을 취소하지 못했어요. 잠시 후 다시 시도해주세요.');
    },
    onSettled: () => {
      // 성공이든 실패든 업로드는 이미 끊겨서 진행 화면에 머무를 수 없습니다.
      setUploadRatio(0);
      mutation.reset();
    },
  });

  const { mutate: requestCancel } = cancelMutation;
  const cancelProcessing = useCallback(() => {
    // 취소를 누른 즉시 업로드를 끊어, 서버가 응답을 계속 붙들고 있지 않게 합니다.
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
