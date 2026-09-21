import { API_BASE_URL } from '@/shared/api';

export function startKakaoLogin(): Promise<void> {
  window.location.assign(new URL('/auth/kakao/authorize', API_BASE_URL));

  return new Promise<void>(() => {});
}
