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
  places: [],
  startDate: '',
  endDate: '',
  attachments: [],
};

export function isTripCreateStep(value: string | null): value is TripCreateStep {
  return TRIP_CREATE_STEPS.some((step) => step === value);
}
