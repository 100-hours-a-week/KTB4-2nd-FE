'use client';

/**
 * 인증 상태가 바뀌면 라우터 캐시에 이전 사용자의 화면이 남을 수 있어
 * 클라이언트 이동 대신 전체 새로고침으로 로그인 화면에 보냅니다.
 */
export function redirectToLogin() {
  window.location.replace('/login');
}
