'use client';

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { tripListQueries, userStatsQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import type { FavoriteTripPageResult } from '../api/getFavoriteTrips';
import { removeTripFavorite } from '../api/tripFavorite';

type FavoriteTripCache = InfiniteData<FavoriteTripPageResult, string | null>;

export function useRemoveFavoriteTrip() {
  const queryClient = useQueryClient();
  const queryKey = tripListQueries.favoriteKeys();

  return useMutation({
    mutationFn: async (tripId: number) => {
      const csrfToken = await fetchCsrfToken();
      await removeTripFavorite(tripId, csrfToken);
    },
    onMutate: (tripId: number) => {
      const snapshot = queryClient.getQueryData<FavoriteTripCache>(queryKey);

      queryClient.setQueryData<FavoriteTripCache>(queryKey, (current) =>
        current === undefined
          ? current
          : {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                totalCount: Math.max(0, page.totalCount - 1),
                trips: page.trips.filter((trip) => trip.id !== tripId),
              })),
            },
      );

      return { snapshot };
    },
    onError: (_error, _tripId, context) => {
      if (context?.snapshot) queryClient.setQueryData(queryKey, context.snapshot);
      toast.error('즐겨찾기를 변경하지 못했어요.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tripListQueries.allKeys(),
        refetchType: 'none',
      });
      void queryClient.invalidateQueries({
        queryKey: userStatsQueries.favoriteTripCount().queryKey,
        refetchType: 'none',
      });
    },
  });
}
