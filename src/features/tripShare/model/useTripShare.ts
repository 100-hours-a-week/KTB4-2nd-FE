'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchCsrfToken } from '@/shared/api/browser';

import { createTripShare } from '../api/createTripShare';
import { searchShareUser } from '../api/searchShareUser';
import type { ShareUser, TripShare, TripSharePermission } from './types';

export function useTripShare(tripId: number) {
  const [shares, setShares] = useState<TripShare[]>([]);

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
      const share = await createTripShare(
        tripId,
        { granteeUserId: user.userId, permission },
        csrfToken,
      );
      return {
        tripShareId: share.tripShareId,
        user,
        permission: share.permission,
        expiresAt: share.expiresAt,
      };
    },
    onSuccess: (share) =>
      setShares((current) => [
        share,
        ...current.filter((item) => item.user.userId !== share.user.userId),
      ]),
  });

  return { shares, search, create };
}
