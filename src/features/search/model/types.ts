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
  /** AI 답변을 만들지 못하면 null이고 answerError에 사유가 담깁니다. */
  answer: string | null;
  answerError: string | null;
  folders: SearchFolder[];
  photos: SearchPhoto[];
};

export type SearchViewState = 'idle' | 'loading' | 'error' | 'ready';

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 100;

/** 백엔드는 한글·영문·숫자·공백만 받아서, 말하듯 입력한 문장부호는 공백으로 바꿉니다. */
export function normalizeSearchQuery(value: string) {
  return value
    .replace(/[^가-힣A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SEARCH_QUERY_MAX_LENGTH);
}
