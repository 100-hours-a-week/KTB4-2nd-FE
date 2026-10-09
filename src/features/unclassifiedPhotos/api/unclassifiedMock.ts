import type { PhotoAccent, PhotoListItem } from '@/features/photoList';

import type { UnclassifiedIssue } from '../model/types';

const MOCK_DELAY_MS = 400;

const MOCK_PHOTO_COUNT: Record<UnclassifiedIssue, number> = {
  UNCLEAR_LOCATION: 14,
  BLURRY: 14,
  DUPLICATED: 35,
};

const PHOTO_ACCENTS: readonly PhotoAccent[] = [
  'coast',
  'night',
  'blossom',
  'sunset',
  'island',
  'desert',
];

const store = new Map<number, Record<UnclassifiedIssue, PhotoListItem[]>>();

export function getMockUnclassifiedPhotos(tripId: number) {
  const existing = store.get(tripId);
  if (existing) return existing;

  let nextId = tripId * 10_000;
  const createPhotos = (count: number): PhotoListItem[] =>
    Array.from({ length: count }, (_, index) => ({
      id: ++nextId,
      thumbnailUrl: null,
      accent: PHOTO_ACCENTS[index % PHOTO_ACCENTS.length],
    }));

  const created: Record<UnclassifiedIssue, PhotoListItem[]> = {
    UNCLEAR_LOCATION: createPhotos(MOCK_PHOTO_COUNT.UNCLEAR_LOCATION),
    BLURRY: createPhotos(MOCK_PHOTO_COUNT.BLURRY),
    DUPLICATED: createPhotos(MOCK_PHOTO_COUNT.DUPLICATED),
  };
  store.set(tripId, created);
  return created;
}

export function removeMockUnclassifiedPhotos(tripId: number, photoIds: number[]) {
  const photos = getMockUnclassifiedPhotos(tripId);
  const removing = new Set(photoIds);

  for (const issue of Object.keys(photos) as UnclassifiedIssue[]) {
    photos[issue] = photos[issue].filter((photo) => !removing.has(photo.id));
  }
}

export function waitMockDelay() {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
}

export function clearMockUnclassifiedIssue(tripId: number, issue: UnclassifiedIssue) {
  getMockUnclassifiedPhotos(tripId)[issue] = [];
}
