import type { PhotoAccent } from '@/features/photoList';
import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { SearchResult } from '../model/types';

export type SearchResponse = {
  query: string;
  answer: string | null;
  answerError: string | null;
  folders: {
    tripId: number;
    tripName: string;
    startDate: string;
    endDate: string;
    regionNames: string[];
    attachmentCount: number;
    thumbnailUrl: string | null;
    score: number;
  }[];
  attachments: {
    tripAttachmentId: number;
    tripId: number;
    tripPlaceId: number;
    thumbnailUrl: string | null;
    score: number;
  }[];
};

const PHOTO_ACCENTS: readonly PhotoAccent[] = [
  'coast',
  'night',
  'blossom',
  'sunset',
  'island',
  'desert',
];

export async function searchTrips(query: string): Promise<SearchResult> {
  const { data } = await apiClient.get<ApiResponse<SearchResponse>>('/search', {
    params: { query },
  });

  return toSearchResult(data.data);
}

function toSearchResult(response: SearchResponse): SearchResult {
  return {
    query: response.query,
    answer: response.answer,
    answerError: response.answerError,
    folders: response.folders.map((folder) => ({
      tripId: folder.tripId,
      tripName: folder.tripName,
      startDate: folder.startDate,
      endDate: folder.endDate,
      regionNames: folder.regionNames,
      photoCount: folder.attachmentCount,
      thumbnailUrl: folder.thumbnailUrl,
    })),
    photos: response.attachments.map((attachment, index) => ({
      id: attachment.tripAttachmentId,
      tripId: attachment.tripId,
      tripPlaceId: attachment.tripPlaceId,
      thumbnailUrl: attachment.thumbnailUrl,
      accent: PHOTO_ACCENTS[index % PHOTO_ACCENTS.length],
    })),
  };
}
