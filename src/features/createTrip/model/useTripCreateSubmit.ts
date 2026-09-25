'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { fetchCsrfToken } from '@/shared/api/browser';

import { createTrip } from '../api/createTrip';
import { uploadInitialAttachments } from '../api/uploadInitialAttachments';
import type { TripCreateFormValues } from './types';

export function useTripCreateSubmit() {
  const createdTripId = useRef<number | null>(null);
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
      return uploadInitialAttachments(
        currentTripId,
        values.attachments,
        uploadCsrfToken,
        setUploadRatio,
      );
    },
  });

  const resetCreatedTrip = useCallback(() => {
    createdTripId.current = null;
    setTripId(null);
  }, []);

  return { ...mutation, tripId, uploadRatio, resetCreatedTrip };
}
