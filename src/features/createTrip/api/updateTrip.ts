import { apiClient } from '@/shared/api/browser';

/** 바뀐 값만 보내면 백엔드가 나머지는 기존 값을 유지합니다. */
export type UpdateTripRequest = {
  tripName?: string;
  startDate?: string;
  endDate?: string;
  regionCodes?: string[];
};

export async function updateTrip(tripId: number, request: UpdateTripRequest, csrfToken: string) {
  await apiClient.patch(`/trips/${tripId}`, request, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
  });
}
