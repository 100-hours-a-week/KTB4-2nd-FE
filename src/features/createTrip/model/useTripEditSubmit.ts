'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { deletePhoto, deletePhotos } from '@/features/photoList';
import { createTripQueries, invalidateTripData } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';

import type { TripEditData } from '../api/getTripForEdit';
import {
  getTripProcessingStatus,
  type TripProcessingStatusResponse,
} from '../api/getTripProcessingStatus';
import { updateTrip, type UpdateTripRequest } from '../api/updateTrip';
import { uploadAdditionalAttachmentBatch } from '../api/uploadAdditionalAttachments';
import { splitIntoUploadBatches } from '../api/uploadInitialAttachments';
import { addPendingTripProcessing, removePendingTripProcessing } from './pendingTripProcessing';
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

export function useTripEditSubmit(
  initial: TripEditData,
  onFinished: (status: TripProcessingStatusResponse | null) => void,
) {
  const tripId = initial.tripId;
  const queryClient = useQueryClient();
  const [uploadRatio, setUploadRatio] = useState(0);
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<number>>(() => new Set());
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
      if (photoIdsToDelete.length > 0) setDeletedIds(new Set(deletedPhotoIds.current));

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
      addPendingTripProcessing({ tripId, kind: 'edit' });
      return { processing: true };
    },
    onError: () => {
      void invalidateTripData(queryClient);
    },
  });

  const processingStatus = useQuery({
    queryKey: [...createTripQueries.processingStatusKeys(tripId), 'edit'],
    queryFn: async () => {
      const status = await getTripProcessingStatus(tripId);
      if (FINISHED_STATUSES.has(status.status)) {
        setAwaitingProcessing(false);
        addition.current = null;
        removePendingTripProcessing(tripId);
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
    resetAddition: () => {
      addition.current = null;
    },
    deletedPhotoIds: deletedIds,
    isSaving: mutation.isPending,
    isProcessing: awaitingProcessing,
    uploadRatio,
    processingStatus: processingStatus.data,
  };
}
