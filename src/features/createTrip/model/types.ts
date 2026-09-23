export const TRIP_CREATE_STEPS = ['name', 'location', 'date', 'images'] as const;

export type TripCreateStep = (typeof TRIP_CREATE_STEPS)[number];

export type PlaceCandidate = {
  regionCode: string;
  regionName: string;
};

export type TripCreateFormValues = {
  tripName: string;
  places: PlaceCandidate[];
  startDate: string;
  endDate: string;
  attachments: File[];
};

export const TRIP_CREATE_DEFAULT_VALUES: TripCreateFormValues = {
  tripName: '',
  // TODO: 검색 API가 간헐적으로 동작하지 않아 임시로 추가했습니다. 안정화되면 제거하고 사용자 선택값만 사용합니다.
  places: [{ regionCode: '41460', regionName: '경기도 용인시' }],
  startDate: '',
  endDate: '',
  attachments: [],
};

export function isTripCreateStep(value: string | null): value is TripCreateStep {
  return TRIP_CREATE_STEPS.some((step) => step === value);
}
