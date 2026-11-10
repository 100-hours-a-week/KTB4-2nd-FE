import type { TripSharePermission } from '@/features/tripShare';
import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import { countNights } from '../model/countNights';
import type { InvitedTripListItem } from '../model/types';

type InvitedTripItemResponse = {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  placeSummary: string;
  attachmentCount: number;
  thumbnailUrl: string | null;
  permission: TripSharePermission;
};

type InvitedTripListResponse = {
  totalCount: number;
  items: InvitedTripItemResponse[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type InvitedTripPageResult = {
  trips: InvitedTripListItem[];
  totalCount: number;
  hasNext: boolean;
  nextCursor: string | null;
};

export async function getInvitedTrips(cursor?: string | null): Promise<InvitedTripPageResult> {
  const { data } = await apiClient.get<ApiResponse<InvitedTripListResponse>>('/trips/shares', {
    params: cursor ? { cursor } : undefined,
  });

  return {
    trips: data.data.items.map(toInvitedTripListItem),
    totalCount: data.data.totalCount,
    hasNext: data.data.hasNext,
    nextCursor: data.data.nextCursor,
  };
}

function toInvitedTripListItem(item: InvitedTripItemResponse): InvitedTripListItem {
  return {
    id: item.tripId,
    name: item.tripName,
    locations: item.placeSummary
      .split(',')
      .map((place) => place.trim())
      .filter((place) => place.length > 0),
    startDate: item.startDate,
    endDate: item.endDate,
    nights: countNights(item.startDate, item.endDate),
    photoCount: item.attachmentCount,
    favorite: false,
    processingStatus: 'ready',
    thumbnailUrl: item.thumbnailUrl,
    permission: item.permission,
  };
}
