import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import { countNights } from '../model/countNights';
import type { TripListItem } from '../model/types';

type FavoriteTripItemResponse = {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  attachmentCount: number;
  thumbnailUrl: string | null;
  isFavorite: boolean;
};

type FavoriteTripListResponse = {
  totalCount: number;
  items: FavoriteTripItemResponse[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type FavoriteTripPageResult = {
  trips: TripListItem[];
  totalCount: number;
  hasNext: boolean;
  nextCursor: string | null;
};

export async function getFavoriteTrips(cursor?: string | null): Promise<FavoriteTripPageResult> {
  const { data } = await apiClient.get<ApiResponse<FavoriteTripListResponse>>('/trips/favorites', {
    params: cursor ? { cursor } : undefined,
  });

  return {
    trips: data.data.items.map(toTripListItem),
    totalCount: data.data.totalCount,
    hasNext: data.data.hasNext,
    nextCursor: data.data.nextCursor,
  };
}

function toTripListItem(item: FavoriteTripItemResponse): TripListItem {
  return {
    id: item.tripId,
    name: item.tripName,
    locations: [],
    startDate: item.startDate,
    endDate: item.endDate,
    nights: countNights(item.startDate, item.endDate),
    photoCount: item.attachmentCount,
    favorite: item.isFavorite,
    processingStatus: 'ready',
    thumbnailUrl: item.thumbnailUrl,
  };
}
