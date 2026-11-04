import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import { countNights } from '../model/countNights';
import type { TripListFilter, TripListItem } from '../model/types';

type TripListItemStatus = 'PROCESSING' | 'UPDATING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

type TripListItemResponse = {
  tripId: number;
  status: TripListItemStatus;
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
    processingStatus: toProcessingStatus(item.status),
    thumbnailUrl: item.thumbnailUrl,
  };
}

function toProcessingStatus(status: TripListItemStatus): TripListItem['processingStatus'] {
  if (status === 'PROCESSING') return 'processing';
  if (status === 'UPDATING') return 'updating';
  return 'ready';
}

function splitPlaceSummary(placeSummary: string) {
  return placeSummary
    .split(',')
    .map((place) => place.trim())
    .filter((place) => place.length > 0);
}
