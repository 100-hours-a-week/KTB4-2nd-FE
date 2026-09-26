import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { PhotoAccent, PhotoListItem } from '../model/types';

type PhotoItemResponse = {
  tripAttachmentId: number;
  thumbnailUrl: string | null;
};

type PlacePhotoListResponse = {
  items: PhotoItemResponse[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type PlacePhotoPageResult = {
  photos: PhotoListItem[];
  hasNext: boolean;
  nextCursor: string | null;
};

/** 응답에 색상 정보가 없어 목록 위치에 따라 기본 배경을 번갈아 적용합니다. */
const PHOTO_ACCENTS: readonly PhotoAccent[] = [
  'coast',
  'night',
  'blossom',
  'sunset',
  'island',
  'desert',
];

export async function getPlacePhotos(
  tripId: number,
  tripPlaceId: number,
  cursor?: string | null,
): Promise<PlacePhotoPageResult> {
  const { data } = await apiClient.get<ApiResponse<PlacePhotoListResponse>>(
    `/trips/${tripId}/place-folders/${tripPlaceId}/attachments`,
    { params: cursor ? { cursor } : undefined },
  );

  return {
    photos: data.data.items.map((item, index) => ({
      id: item.tripAttachmentId,
      thumbnailUrl: item.thumbnailUrl,
      accent: PHOTO_ACCENTS[index % PHOTO_ACCENTS.length],
    })),
    hasNext: data.data.hasNext,
    nextCursor: data.data.nextCursor,
  };
}
