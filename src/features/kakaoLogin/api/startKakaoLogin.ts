import { API_BASE_URL } from '@/shared/api';

export function startKakaoLogin(): Promise<void> {
  window.location.assign(`${API_BASE_URL}/auth/kakao/authorize`);

  return new Promise<void>(() => {});
}
