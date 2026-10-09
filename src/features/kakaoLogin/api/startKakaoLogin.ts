import { API_BASE_URL } from '@/shared/api';

export function startKakaoLogin(): Promise<void> {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${API_BASE_URL}/auth/kakao/authorize`);

  return new Promise<void>(() => {});
}
