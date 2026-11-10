'use client';

import { useQuery } from '@tanstack/react-query';

import { tripShareQueries } from '@/queryFactory';

import type { TripAccessPermission } from './types';

export type TripAccess = {
  isChecking: boolean;
  isOwner: boolean;
  canEdit: boolean;
};

const CHECKING: TripAccess = { isChecking: true, isOwner: false, canEdit: false };
const UNVERIFIED: TripAccess = { isChecking: false, isOwner: true, canEdit: true };

const ACCESS_BY_PERMISSION: Record<TripAccessPermission, TripAccess> = {
  OWNER: { isChecking: false, isOwner: true, canEdit: true },
  WRITE: { isChecking: false, isOwner: false, canEdit: true },
  READ: { isChecking: false, isOwner: false, canEdit: false },
};

export function useTripAccess(tripId: number): TripAccess {
  const { data, isPending, isError } = useQuery(tripShareQueries.myPermission(tripId));

  if (isPending) return CHECKING;
  if (isError || !data) return UNVERIFIED;
  return ACCESS_BY_PERMISSION[data];
}
