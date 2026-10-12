import { STORY_FOLDER_LIMIT, isStoryMood, type StoryCreateFormValues } from './types';

export type StoryCreateDraft = StoryCreateFormValues & {
  generationId: number | null;
  startedAt: number | null;
};

const STORY_CREATE_DRAFT_KEY_PREFIX = 'story-create-draft-v1:';

const listeners = new Set<() => void>();

function notifyDraftChange() {
  listeners.forEach((listener) => listener());
}

function draftKey(tripId: number) {
  return `${STORY_CREATE_DRAFT_KEY_PREFIX}${tripId}`;
}

function createEmptyDraft(): StoryCreateDraft {
  return { mood: null, tripPlaceIds: [], generationId: null, startedAt: null };
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isStoryCreateDraft(value: unknown): value is StoryCreateDraft {
  if (typeof value !== 'object' || value === null) return false;

  const draft = value as Record<string, unknown>;
  return (
    (draft.mood === null || isStoryMood(draft.mood)) &&
    Array.isArray(draft.tripPlaceIds) &&
    draft.tripPlaceIds.length <= STORY_FOLDER_LIMIT &&
    draft.tripPlaceIds.every(isPositiveInteger) &&
    new Set(draft.tripPlaceIds).size === draft.tripPlaceIds.length &&
    (draft.generationId === null || isPositiveInteger(draft.generationId)) &&
    (draft.startedAt === null || isPositiveInteger(draft.startedAt))
  );
}

export function readStoryCreateDraft(tripId: number): StoryCreateDraft {
  if (typeof window === 'undefined') return createEmptyDraft();

  try {
    const storedDraft = window.localStorage.getItem(draftKey(tripId));
    if (!storedDraft) return createEmptyDraft();

    const parsedDraft: unknown = JSON.parse(storedDraft);
    return isStoryCreateDraft(parsedDraft) ? parsedDraft : createEmptyDraft();
  } catch {
    return createEmptyDraft();
  }
}

export function updateStoryCreateDraft(tripId: number, patch: Partial<StoryCreateDraft>): void {
  if (typeof window === 'undefined') return;

  const current = readStoryCreateDraft(tripId);
  const next: StoryCreateDraft = {
    mood: patch.mood !== undefined ? patch.mood : current.mood,
    tripPlaceIds: patch.tripPlaceIds ?? current.tripPlaceIds,
    generationId: patch.generationId !== undefined ? patch.generationId : current.generationId,
    startedAt: patch.startedAt !== undefined ? patch.startedAt : current.startedAt,
  };

  try {
    window.localStorage.setItem(draftKey(tripId), JSON.stringify(next));
  } catch {}
  notifyDraftChange();
}

export function clearStoryCreateDraft(tripId: number): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(draftKey(tripId));
  } catch {}
  notifyDraftChange();
}

export function clearAllStoryCreateDrafts(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) =>
      window.localStorage.key(index),
    );
    keys
      .filter((key): key is string => key?.startsWith(STORY_CREATE_DRAFT_KEY_PREFIX) ?? false)
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {}
  notifyDraftChange();
}

function readDraftTripIds(): number[] {
  const keys = Array.from({ length: window.localStorage.length }, (_, index) =>
    window.localStorage.key(index),
  );
  return keys
    .filter((key): key is string => key?.startsWith(STORY_CREATE_DRAFT_KEY_PREFIX) ?? false)
    .map((key) => Number(key.slice(STORY_CREATE_DRAFT_KEY_PREFIX.length)))
    .filter(isPositiveInteger);
}

export function getActiveStoryGenerationsSnapshot(): string {
  if (typeof window === 'undefined') return '';

  try {
    return readDraftTripIds()
      .map((tripId) => ({ tripId, generationId: readStoryCreateDraft(tripId).generationId }))
      .filter((job) => job.generationId !== null)
      .map((job) => `${job.tripId}:${job.generationId}`)
      .sort()
      .join(',');
  } catch {
    return '';
  }
}

export function parseActiveStoryGenerations(snapshot: string) {
  return snapshot
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const [tripId, generationId] = entry.split(':').map(Number);
      return { tripId, generationId };
    });
}

export function subscribeStoryCreateDrafts(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(STORY_CREATE_DRAFT_KEY_PREFIX)) listener();
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}
