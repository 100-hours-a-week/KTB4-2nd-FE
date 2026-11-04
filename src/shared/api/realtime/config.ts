import { API_BASE_URL } from '../config';

/** 별도 주소가 없으면 화면과 같은 출처의 `/api/ws`로 연결합니다. */
export function getRealtimeUrl() {
  const configured = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (configured) return configured;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${API_BASE_URL}/ws`;
}
