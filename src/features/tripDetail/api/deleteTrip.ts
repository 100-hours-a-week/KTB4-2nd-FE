import { apiClient } from '@/shared/api/browser';

/** 성공하면 204로 응답합니다. 정리 중인 여행은 409 TRIP_DELETION_NOT_ALLOWED가 옵니다. */
export async function deleteTrip(tripId: number, csrfToken: string): Promise<void> {
  await apiClient.delete(`/trips/${tripId}`, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
  });
}
