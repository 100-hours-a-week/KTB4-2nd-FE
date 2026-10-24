// 브라우저 URL 파서는 백슬래시를 슬래시로 바꾸고 제어 문자를 지워서, `/\evil.com`처럼
// 우리 경로로 보이는 값이 외부 주소(`//evil.com`)로 해석될 수 있습니다.
const UNSAFE_PATH_PATTERN = /[\\\u0000-\u001f\u007f]/;
const PARSE_BASE = 'http://localhost';

/** 로그인 갱신 뒤 돌아갈 경로를 같은 사이트 안의 경로로만 받아들이고, 아니면 홈으로 보냅니다. */
export function toSafeReturnPath(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (UNSAFE_PATH_PATTERN.test(value)) return '/';

  try {
    const url = new URL(value, PARSE_BASE);
    if (url.origin !== PARSE_BASE) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

/**
 * 로그인이 풀린 화면에서 갈 곳입니다.
 * 이미 한 번 갱신하고 돌아온 요청(`renewed=1`)이면 다시 갱신하지 않고 로그인으로 보내 무한 반복을 막습니다.
 */
export function getRenewRedirectPath(next: string, renewed: string | string[] | undefined) {
  return renewed === '1' ? '/login' : `/auth/renew?next=${encodeURIComponent(next)}`;
}
