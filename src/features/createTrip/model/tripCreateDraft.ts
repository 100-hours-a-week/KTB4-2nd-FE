import {
  TRIP_CREATE_DEFAULT_VALUES,
  type PlaceCandidate,
  type TripCreateFormValues,
} from './types';

const TRIP_CREATE_DRAFT_KEY = 'trip-create-draft-v1';

type TripCreateDraft = Omit<TripCreateFormValues, 'attachments'>;

function createDefaultValues(): TripCreateFormValues {
  return {
    ...TRIP_CREATE_DEFAULT_VALUES,
    places: [...TRIP_CREATE_DEFAULT_VALUES.places],
    attachments: [],
  };
}

function isPlaceCandidate(value: unknown): value is PlaceCandidate {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return typeof candidate.regionCode === 'string' && typeof candidate.regionName === 'string';
}

function isTripCreateDraft(value: unknown): value is TripCreateDraft {
  if (typeof value !== 'object' || value === null) return false;

  const draft = value as Record<string, unknown>;
  return (
    typeof draft.tripName === 'string' &&
    Array.isArray(draft.places) &&
    draft.places.every(isPlaceCandidate) &&
    typeof draft.startDate === 'string' &&
    typeof draft.endDate === 'string'
  );
}

export function readTripCreateDraft(): TripCreateFormValues {
  if (typeof window === 'undefined') return createDefaultValues();

  try {
    const storedDraft = window.localStorage.getItem(TRIP_CREATE_DRAFT_KEY);
    if (!storedDraft) return createDefaultValues();

    const parsedDraft: unknown = JSON.parse(storedDraft);
    if (!isTripCreateDraft(parsedDraft)) return createDefaultValues();

    return { ...parsedDraft, attachments: [] };
  } catch {
    return createDefaultValues();
  }
}

export function saveTripCreateDraft(values: TripCreateFormValues): void {
  if (typeof window === 'undefined') return;

  const draft: TripCreateDraft = {
    tripName: values.tripName,
    places: values.places,
    startDate: values.startDate,
    endDate: values.endDate,
  };

  try {
    window.localStorage.setItem(TRIP_CREATE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // 저장 공간이 차 있거나 브라우저에서 저장소 접근을 막아도 폼 입력은 계속할 수 있어야 합니다.
  }
}

export function clearTripCreateDraft(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(TRIP_CREATE_DRAFT_KEY);
  } catch {
    // 저장소 접근이 제한된 환경에서는 메모리의 폼 상태만 사용합니다.
  }
}
