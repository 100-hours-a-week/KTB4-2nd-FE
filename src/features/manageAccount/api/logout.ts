import { apiClient } from '@/shared/api/browser';

/** 성공하면 백엔드가 accessToken·refreshToken 쿠키를 만료시켜 204로 응답합니다. */
export async function logout(csrfToken: string): Promise<void> {
  await apiClient.post('/auth/logout', null, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
    // 세션이 이미 없어 401이면 재발급할 이유가 없으므로 그대로 실패로 받습니다.
    skipAuthRefresh: true,
  });
}
