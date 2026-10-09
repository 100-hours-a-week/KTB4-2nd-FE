import type { PhotoAccent } from '@/features/photoList';

export type SearchFolder = {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  regionNames: string[];
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
