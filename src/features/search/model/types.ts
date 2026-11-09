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
  tripName: string;
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

export type SearchPhotoGroup = {
  tripId: number;
  tripName: string;
  photos: SearchPhoto[];
};

export function groupSearchPhotosByTrip(photos: SearchPhoto[]): SearchPhotoGroup[] {
  const groups = new Map<number, SearchPhotoGroup>();

  for (const photo of photos) {
    const group = groups.get(photo.tripId);
    if (group) group.photos.push(photo);
    else
      groups.set(photo.tripId, { tripId: photo.tripId, tripName: photo.tripName, photos: [photo] });
  }

  return [...groups.values()];
}

export type SearchViewState = 'idle' | 'loading' | 'error' | 'ready';

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 100;

export function normalizeSearchQuery(value: string) {
  return sliceChars(normalizeText(value.replace(/\s+/g, ' ')), SEARCH_QUERY_MAX_LENGTH);
}

export function isSearchableQuery(query: string) {
  return hasVisibleText(query) && countChars(query) >= SEARCH_QUERY_MIN_LENGTH;
}
