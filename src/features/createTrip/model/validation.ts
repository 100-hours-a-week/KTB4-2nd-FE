import type { TripCreateFormValues, TripCreateStep } from './types';

export const TRIP_NAME_MAX_LENGTH = 10;
export const TRIP_PLACE_MAX_COUNT = 10;
export const TRIP_DATE_MAX_DAYS = 92;

export function validateTripName(value: string) {
  if (!value.trim()) return '여행 폴더 이름을 입력해주세요.';
  if (value.length > TRIP_NAME_MAX_LENGTH) {
    return `여행 폴더 이름은 ${TRIP_NAME_MAX_LENGTH}자까지 입력할 수 있어요.`;
  }
  return true;
}

export function validateTripPlaces(value: TripCreateFormValues['places']) {
  if (value.length === 0) return '여행지를 한 곳 이상 선택해주세요.';
  if (value.length > TRIP_PLACE_MAX_COUNT) {
    return `여행지는 최대 ${TRIP_PLACE_MAX_COUNT}개까지 선택할 수 있어요.`;
  }
  return true;
}

export function validateTripDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return '여행 시작일과 종료일을 선택해주세요.';

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const selectedDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  if (selectedDays > TRIP_DATE_MAX_DAYS) {
    return `여행 기간은 최대 ${TRIP_DATE_MAX_DAYS}일까지 선택할 수 있어요.`;
  }
  return true;
}

export function getAccessibleTripCreateStep(
  requestedStep: TripCreateStep,
  values: TripCreateFormValues,
): TripCreateStep {
  if (requestedStep === 'name') return requestedStep;
  if (validateTripName(values.tripName) !== true) return 'name';

  if (requestedStep === 'location') return requestedStep;
  if (validateTripPlaces(values.places) !== true) return 'location';

  if (requestedStep === 'date') return requestedStep;
  if (validateTripDateRange(values.startDate, values.endDate) !== true) return 'date';

  return requestedStep;
}

export function isSearchablePlaceQuery(query: string) {
  return /^[가-힣]+$/.test(query);
}
