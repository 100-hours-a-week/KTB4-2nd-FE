import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { StoryFolderAccent, StorySourceFolder } from '../model/types';

type StorySourceFolderListResponse = {
  items: {
    tripPlaceId: number;
    placeName: string;
    attachmentCount: number;
    thumbnailUrl: string | null;
    selected: boolean;
  }[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type StorySourceFolderPageResult = {
  folders: StorySourceFolder[];
  hasNext: boolean;
  nextCursor: string | null;
};

const FOLDER_ACCENTS: readonly StoryFolderAccent[] = [
  'coast',
  'sunset',
  'island',
  'night',
  'field',
  'sky',
];

export async function getStorySourceFolders(
  tripId: number,
  cursor?: string | null,
): Promise<StorySourceFolderPageResult> {
  const { data } = await apiClient.get<ApiResponse<StorySourceFolderListResponse>>(
    `/trips/${tripId}/story/source-folders`,
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
