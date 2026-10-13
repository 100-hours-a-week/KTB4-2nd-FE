import { apiClient } from '@/shared/api/browser';

export async function cancelStoryGeneration(
  generationId: number,
  csrfToken: string,
): Promise<void> {
  await apiClient.delete(`/story-generations/${generationId}`, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
  });
}
