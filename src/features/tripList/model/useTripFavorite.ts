'use client';

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { tripListQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import type { TripListPageResult } from '../api/getTrips';
import { registerTripFavorite, removeTripFavorite } from '../api/tripFavorite';
import type { TripListFilter } from './types';

type TripListCache = InfiniteData<TripListPageResult, string | null>;

type ToggleFavoriteVariables = {
  tripId: number;
  favorite: boolean;
};

export function useTripFavorite(filter: TripListFilter) {
  const queryClient = useQueryClient();
  const queryKey = tripListQueries.listKeys(filter);

  const mutation = useMutation({
    mutationFn: async ({ tripId, favorite }: ToggleFavoriteVariables) => {
      const csrfToken = await fetchCsrfToken();

      if (favorite) {
        await registerTripFavorite(tripId, csrfToken);
        return;
      }

      await removeTripFavorite(tripId, csrfToken);
    },
    onMutate: ({ tripId, favorite }: ToggleFavoriteVariables) => {
      const snapshot = queryClient.getQueryData<TripListCache>(queryKey);

      queryClient.setQueryData<TripListCache>(queryKey, (current) =>
        current === undefined
          ? current
          : {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                trips: page.trips.map((trip) =>
                  trip.id === tripId ? { ...trip, favorite } : trip,
                ),
              })),
            },
      );

      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(queryKey, context.snapshot);
      }

      toast.error('즐겨찾기를 변경하지 못했어요.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tripListQueries.allKeys(),
        refetchType: 'none',
      });
    },
  });

  return mutation;
}
