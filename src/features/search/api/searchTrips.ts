import type { PhotoAccent } from '@/features/photoList';

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
  await new Promise((resolve) => setTimeout(resolve, 600));
  return toSearchResult(createMockSearchResponse(query));
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

function createMockSearchResponse(query: string): SearchResponse {
  if (query.includes('없음')) {
    return { query, answer: null, answerError: null, folders: [], attachments: [] };
  }

  return {
    query,
    answer: '2026년 8월 25일 화요일이에요.',
    answerError: null,
    folders: [
      {
        tripId: 1,
        tripName: '제주도 가을 여행',
        startDate: '2026-08-24',
        endDate: '2026-08-27',
        regionNames: ['제주시', '서귀포시'],
        attachmentCount: 128,
        thumbnailUrl: null,
        score: 0.92,
      },
      {
        tripId: 2,
        tripName: '부산 바다 여행',
        startDate: '2026-06-12',
        endDate: '2026-06-14',
        regionNames: ['해운대구'],
        attachmentCount: 64,
        thumbnailUrl: null,
        score: 0.71,
      },
    ],
    attachments: Array.from({ length: 14 }, (_, index) => ({
      tripAttachmentId: index + 1,
      tripId: 1,
      tripPlaceId: 1,
      thumbnailUrl: null,
      score: 1 - index * 0.05,
    })),
  };
}
