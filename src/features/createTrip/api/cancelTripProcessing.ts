import { apiClient } from '@/shared/api/browser';

/**
 * 진행 중인 사진 정리를 취소합니다. 성공하면 204로 응답합니다.
 * 취소된 여행은 CANCELED가 되어 같은 여행에 다시 업로드할 수 없습니다.
 */
export async function cancelTripProcessing(tripId: number, csrfToken: string): Promise<void> {
  await apiClient.delete(`/trips/${tripId}/processing`, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
  });
}
