import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripShare, TripSharePermission } from '../model/types';

type TripShareListResponse = {
  items: {
    tripShareId: number;
    granteeUserId: number;
    email: string;
    permission: TripSharePermission;
    expiresAt: string;
  }[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type TripSharePage = {
  shares: TripShare[];
  nextCursor: string | null;
};

export async function getTripShares(tripId: number, cursor: string | null): Promise<TripSharePage> {
  const { data } = await apiClient.get<ApiResponse<TripShareListResponse>>(
    `/trips/${tripId}/shares`,
    { params: cursor ? { cursor } : undefined },
  );

  return {
    shares: data.data.items,
    nextCursor: data.data.hasNext ? data.data.nextCursor : null,
  };
}
