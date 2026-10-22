import { apiClient } from '@/shared/api/browser';

export async function withdraw(csrfToken: string): Promise<void> {
  await apiClient.delete('/users/me', {
    headers: { 'X-CSRF-TOKEN': csrfToken },
    skipAuthRefresh: true,
  });
}
