'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { deletePhoto, deletePhotos } from '@/features/photoList';
import { createTripQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';

import type { TripEditData } from '../api/getTripForEdit';
import {
  getTripProcessingStatus,
  type TripProcessingStatusResponse,
} from '../api/getTripProcessingStatus';
import { updateTrip, type UpdateTripRequest } from '../api/updateTrip';
import { uploadAdditionalAttachmentBatch } from '../api/uploadAdditionalAttachments';
import { splitIntoUploadBatches } from '../api/uploadInitialAttachments';
import type { TripCreateFormValues } from './types';

export type TripEditSubmitInput = {
  values: TripCreateFormValues;
  removedPhotoIds: number[];
};

type AdditionPoint = {
  files: File[];
  additionId: string;
  completedBatches: number;
};

const FINISHED_STATUSES = new Set(['COMPLETED', 'FAILED', 'CANCELED']);

/** 처음 불러온 값과 달라진 항목만 PATCH 요청에 담습니다. 바뀐 게 없으면 null입니다. */
export function getTripUpdateRequest(
  initial: TripEditData,
  values: TripCreateFormValues,
): UpdateTripRequest | null {
  const request: UpdateTripRequest = {};
  if (values.tripName !== initial.tripName) request.tripName = values.tripName;
  if (values.startDate !== initial.startDate) request.startDate = values.startDate;
  if (values.endDate !== initial.endDate) request.endDate = values.endDate;

  const regionCodes = values.places.map((place) => place.regionCode);
  const initialRegionCodes = initial.places.map((place) => place.regionCode);
  if (regionCodes.join() !== initialRegionCodes.join()) request.regionCodes = regionCodes;

  return Object.keys(request).length > 0 ? request : null;
}

export function hasTripEditChanges(initial: TripEditData, input: TripEditSubmitInput) {
  return (
    getTripUpdateRequest(initial, input.values) !== null ||
    input.removedPhotoIds.length > 0 ||
    input.values.attachments.length > 0
  );
}

function isSameFiles(left: File[], right: File[]) {
  return left.length === right.length && left.every((file, index) => file === right[index]);
}

/**
 * 정보 수정(PATCH) → 사진 삭제 → 사진 추가 순서로 저장합니다.
 * 백엔드는 사진 추가가 끝나기 전까지 정보 수정을 막으므로 사진 추가를 마지막에 보냅니다.
 * 중간에 실패하면 이미 지운 사진과 이미 올린 Batch는 다시 보내지 않고 이어서 시도합니다.
 */
export function useTripEditSubmit(
  initial: TripEditData,
  onFinished: (status: TripProcessingStatusResponse | null) => void,
) {
  const tripId = initial.tripId;
  const [uploadRatio, setUploadRatio] = useState(0);
  const [awaitingProcessing, setAwaitingProcessing] = useState(false);
  const deletedPhotoIds = useRef(new Set<number>());
  const addition = useRef<AdditionPoint | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ values, removedPhotoIds }: TripEditSubmitInput) => {
      const csrfToken = await fetchCsrfToken();

      const updateRequest = getTripUpdateRequest(initial, values);
      if (updateRequest) await updateTrip(tripId, updateRequest, csrfToken);

      const photoIdsToDelete = removedPhotoIds.filter((id) => !deletedPhotoIds.current.has(id));
      if (photoIdsToDelete.length === 1) await deletePhoto(photoIdsToDelete[0], csrfToken);
      else if (photoIdsToDelete.length > 1) await deletePhotos(photoIdsToDelete, csrfToken);
      photoIdsToDelete.forEach((id) => deletedPhotoIds.current.add(id));

      const files = values.attachments;
      if (files.length === 0) return { processing: false };

      if (!addition.current || !isSameFiles(addition.current.files, files)) {
        addition.current = { files, additionId: crypto.randomUUID(), completedBatches: 0 };
      }
      const point = addition.current;
      const batches = splitIntoUploadBatches(files);
      setUploadRatio(point.completedBatches / batches.length);

      for (let index = point.completedBatches; index < batches.length; index += 1) {
        await uploadAdditionalAttachmentBatch({
          tripId,
          additionId: point.additionId,
          files: batches[index],
          batchNo: index + 1,
          totalAttachmentCount: files.length,
          complete: index === batches.length - 1,
          csrfToken,
          onUploadProgress: (ratio) => setUploadRatio((index + ratio) / batches.length),
        });
        point.completedBatches = index + 1;
      }

      setUploadRatio(1);
      setAwaitingProcessing(true);
      return { processing: true };
    },
  });

  // 추가한 사진의 장소 분류가 끝날 때까지 여행 생성과 같은 처리 상태 API로 확인합니다.
  const processingStatus = useQuery({
    queryKey: [...createTripQueries.processingStatusKeys(tripId), 'edit'],
    queryFn: async () => {
      const status = await getTripProcessingStatus(tripId);
      if (FINISHED_STATUSES.has(status.status)) {
        setAwaitingProcessing(false);
        addition.current = null;
        onFinished(status);
      }
      return status;
    },
    enabled: awaitingProcessing,
    refetchInterval: 2_000,
  });

  return {
    submit: (input: TripEditSubmitInput, options?: { onError?: (error: unknown) => void }) =>
      mutation.mutate(input, {
        onSuccess: ({ processing }) => {
          if (!processing) onFinished(null);
        },
        onError: options?.onError,
      }),
    /** 사진 추가 요청이 잘못돼 처음부터 다시 올려야 할 때 사용합니다. */
    resetAddition: () => {
      addition.current = null;
    },
    isSaving: mutation.isPending,
    isProcessing: awaitingProcessing,
    uploadRatio,
    processingStatus: processingStatus.data,
  };
}
