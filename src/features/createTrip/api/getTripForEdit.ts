import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { PlaceCandidate } from '../model/types';

type TripEditApiResponse = {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  regions: { regionId: number; regionCode: string; regionName: string }[];
  attachmentCount: number;
  attachments: {
    items: { tripAttachmentId: number; thumbnailUrl: string | null }[];
    hasNext: boolean;
    nextCursor: string | null;
  };
};

export type TripEditPhoto = {
  id: number;
  thumbnailUrl: string | null;
};

export type TripEditData = {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  places: PlaceCandidate[];
  photoCount: number;
  photos: TripEditPhoto[];
};

async function getTripEditPage(tripId: number, cursor: string | null) {
  const { data } = await apiClient.get<ApiResponse<TripEditApiResponse>>(`/trips/${tripId}/edit`, {
    params: cursor ? { cursor } : undefined,
  });
  return data.data;
}

/** 수정 화면에서 기존 사진을 모두 보여주고 지울 수 있도록 사진 페이지를 끝까지 이어서 받습니다. */
export async function getTripForEdit(tripId: number): Promise<TripEditData> {
  const first = await getTripEditPage(tripId, null);
  const photos = [...first.attachments.items];
  let cursor = first.attachments.hasNext ? first.attachments.nextCursor : null;

  while (cursor) {
    const page = await getTripEditPage(tripId, cursor);
    photos.push(...page.attachments.items);
    cursor = page.attachments.hasNext ? page.attachments.nextCursor : null;
  }

  return {
    tripId: first.tripId,
    tripName: first.tripName,
    startDate: first.startDate,
    endDate: first.endDate,
    places: first.regions.map((region) => ({
      regionCode: region.regionCode,
      regionName: region.regionName,
    })),
    photoCount: first.attachmentCount,
    photos: photos.map((item) => ({ id: item.tripAttachmentId, thumbnailUrl: item.thumbnailUrl })),
  };
}
