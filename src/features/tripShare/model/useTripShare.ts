'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { tripShareQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';

import { createTripShare } from '../api/createTripShare';
import { searchShareUser } from '../api/searchShareUser';
import type { ShareUser, TripSharePermission } from './types';

export function useTripShare(tripId: number) {
  const queryClient = useQueryClient();
  const list = useInfiniteQuery(tripShareQueries.list(tripId));
  const shares = list.data?.pages.flatMap((page) => page.shares) ?? [];

  const search = useMutation({ mutationFn: (email: string) => searchShareUser(email) });

  const create = useMutation({
    mutationFn: async ({
      user,
      permission,
    }: {
      user: ShareUser;
      permission: TripSharePermission;
    }) => {
      const csrfToken = await fetchCsrfToken();
      return createTripShare(tripId, { granteeUserId: user.userId, permission }, csrfToken);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripShareQueries.listKeys(tripId) }),
  });

  return { shares, list, search, create };
}
