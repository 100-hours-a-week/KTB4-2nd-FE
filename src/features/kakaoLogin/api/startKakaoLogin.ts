const MOCK_LOGIN_DELAY = 500;

/**
 * 카카오 OAuth API가 연결되면 이 함수에서 인증 URL로 이동하도록 교체합니다.
 */
export async function startKakaoLogin(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, MOCK_LOGIN_DELAY));
}
