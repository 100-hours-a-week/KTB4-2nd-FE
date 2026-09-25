import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripListFilter, TripListItem } from '../model/types';

type TripListItemResponse = {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  placeSummary: string;
  attachmentCount: number;
  isFavorite: boolean;
  thumbnailUrl: string | null;
};

type TripListResponse = {
  items: TripListItemResponse[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type TripListPageResult = {
  trips: TripListItem[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type GetTripsParams = TripListFilter & {
  cursor?: string | null;
};

const MILLISECONDS_PER_DAY = 86_400_000;

export async function getTrips({
  sort,
  favorite,
  cursor,
}: GetTripsParams): Promise<TripListPageResult> {
  const { data } = await apiClient.get<ApiResponse<TripListResponse>>('/trips', {
    params: { sort, favorite: String(favorite), ...(cursor ? { cursor } : {}) },
  });

  return {
    trips: data.data.items.map(toTripListItem),
    hasNext: data.data.hasNext,
    nextCursor: data.data.nextCursor,
  };
}

function toTripListItem(item: TripListItemResponse): TripListItem {
  return {
    id: item.tripId,
    name: item.tripName,
    locations: splitPlaceSummary(item.placeSummary),
    startDate: item.startDate,
    endDate: item.endDate,
    nights: countNights(item.startDate, item.endDate),
    photoCount: item.attachmentCount,
    favorite: item.isFavorite,
    processingStatus: 'ready',
    thumbnailUrl: item.thumbnailUrl,
  };
}

function splitPlaceSummary(placeSummary: string) {
  return placeSummary
    .split(',')
    .map((place) => place.trim())
    .filter((place) => place.length > 0);
}

function countNights(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start) || Number.isNaN(end)) return 0;

  return Math.max(0, Math.round((end - start) / MILLISECONDS_PER_DAY));
}
