import type { PhotoAccent } from '@/features/photoList';

/** 검색 결과 폴더는 여행이 아니라 여행 안의 장소 폴더 단위입니다. */
export type SearchFolder = {
  tripId: number;
  tripPlaceId: number;
  tripName: string;
  placeName: string;
  photoCount: number;
  thumbnailUrl: string | null;
};

export type SearchPhoto = {
  id: number;
  tripId: number;
  tripPlaceId: number;
  thumbnailUrl: string | null;
  accent: PhotoAccent;
};

export type SearchResult = {
  query: string;
  answer: string | null;
  answerError: string | null;
  folders: SearchFolder[];
  photos: SearchPhoto[];
};

export type SearchViewState = 'idle' | 'loading' | 'error' | 'ready';

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 100;

export function normalizeSearchQuery(value: string) {
  return value
    .replace(/[^가-힣A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SEARCH_QUERY_MAX_LENGTH);
}
