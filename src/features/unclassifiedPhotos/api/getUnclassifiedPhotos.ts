import type { PhotoAccent } from '@/features/photoList';
import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { UnclassifiedIssue, UnclassifiedPhoto } from '../model/types';

type UnclassifiedAttachmentListResponse = {
  issue: UnclassifiedIssue;
  name: string;
  attachmentCount: number;
  items: {
    tripAttachmentId: number;
    thumbnailUrl: string | null;
    issue: UnclassifiedIssue;
    restoreTripPlaceId: number | null;
  }[];
  hasNext: boolean;
  nextCursor: string | null;
};

export type UnclassifiedPhotoPageResult = {
  photos: UnclassifiedPhoto[];
  totalCount: number;
  hasNext: boolean;
  nextCursor: string | null;
};

const PHOTO_ACCENTS: readonly PhotoAccent[] = [
  'coast',
  'night',
  'blossom',
  'sunset',
  'island',
  'desert',
];

export async function getUnclassifiedPhotos(
  tripId: number,
  issue: UnclassifiedIssue,
  cursor?: string | null,
): Promise<UnclassifiedPhotoPageResult> {
  const { data } = await apiClient.get<ApiResponse<UnclassifiedAttachmentListResponse>>(
    `/trips/${tripId}/unclassified-folders/${issue}/attachments`,
    { params: cursor ? { cursor } : undefined },
  );

  return {
    photos: data.data.items.map((item, index) => ({
      id: item.tripAttachmentId,
      thumbnailUrl: item.thumbnailUrl,
      accent: PHOTO_ACCENTS[index % PHOTO_ACCENTS.length],
      restoreTripPlaceId: item.restoreTripPlaceId,
    })),
    totalCount: data.data.attachmentCount,
    hasNext: data.data.hasNext,
    nextCursor: data.data.nextCursor,
  };
}
