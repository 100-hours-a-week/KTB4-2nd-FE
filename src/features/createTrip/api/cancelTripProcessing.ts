import { apiClient } from '@/shared/api/browser';

export async function cancelTripProcessing(tripId: number, csrfToken: string): Promise<void> {
  await apiClient.delete(`/trips/${tripId}/processing`, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
  });
}
