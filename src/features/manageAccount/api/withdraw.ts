import { apiClient } from '@/shared/api/browser';

/**
 * 성공하면 204로 응답합니다.
 * 로그아웃과 달리 쿠키를 만료시켜 주지 않으므로 호출한 쪽에서 로그인 화면으로 보내야 합니다.
 */
export async function withdraw(csrfToken: string): Promise<void> {
  await apiClient.delete('/users/me', {
    headers: { 'X-CSRF-TOKEN': csrfToken },
    skipAuthRefresh: true,
  });
}
