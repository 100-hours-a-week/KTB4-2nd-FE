import { apiClient } from '@/shared/api/browser';

export async function logout(csrfToken: string): Promise<void> {
  await apiClient.post('/auth/logout', null, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
    skipAuthRefresh: true,
  });
}
