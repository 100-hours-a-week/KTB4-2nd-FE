import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripPlaceFolder, TripPlaceFolderAccent } from '../model/types';

type TripPlaceFolderItemResponse = {
  tripPlaceId: number;
  placeName: string;
  attachmentCount: number;
  thumbnailUrl: string | null;
};

type TripPlaceFolderListResponse = {
  items: TripPlaceFolderItemResponse[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type TripPlaceFolderPageResult = {
  folders: TripPlaceFolder[];
  hasNext: boolean;
  nextCursor: string | null;
};

/** 응답에 색상 정보가 없어 목록 위치에 따라 카드 배경을 번갈아 적용합니다. */
const FOLDER_ACCENTS: readonly TripPlaceFolderAccent[] = [
  'coast',
  'sunset',
  'island',
  'night',
  'field',
  'sky',
];

export async function getTripPlaceFolders(
  tripId: number,
  cursor?: string | null,
): Promise<TripPlaceFolderPageResult> {
  const { data } = await apiClient.get<ApiResponse<TripPlaceFolderListResponse>>(
    `/trips/${tripId}/place-folders`,
    { params: cursor ? { cursor } : undefined },
  );

  return {
    folders: data.data.items.map((item, index) => ({
      id: item.tripPlaceId,
      name: item.placeName,
      photoCount: item.attachmentCount,
      thumbnailUrl: item.thumbnailUrl,
      accent: FOLDER_ACCENTS[index % FOLDER_ACCENTS.length],
    })),
    hasNext: data.data.hasNext,
    nextCursor: data.data.nextCursor,
  };
}
