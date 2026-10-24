import type { PhotoAccent } from '@/features/photoList';
import { countChars, hasVisibleText, normalizeText, sliceChars } from '@/shared/lib/text';

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
  return sliceChars(normalizeText(value.replace(/\s+/g, ' ')), SEARCH_QUERY_MAX_LENGTH);
}

/** 보이지 않는 문자만 있거나 2글자(이모지는 1글자로 셈)보다 짧으면 검색하지 않습니다. */
export function isSearchableQuery(query: string) {
  return hasVisibleText(query) && countChars(query) >= SEARCH_QUERY_MIN_LENGTH;
}
