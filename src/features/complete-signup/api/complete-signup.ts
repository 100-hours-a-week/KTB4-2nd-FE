export type CompleteSignupRequest = {
  nickname: string;
};

export type CompleteSignupResponse = {
  nickname: string;
};

const MOCK_REQUEST_DELAY = 500;

/**
 * 회원가입 API가 확정되면 이 함수의 내부 구현만 실제 HTTP 요청으로 교체합니다.
 */
export async function completeSignup(
  request: CompleteSignupRequest,
): Promise<CompleteSignupResponse> {
  await new Promise((resolve) => window.setTimeout(resolve, MOCK_REQUEST_DELAY));

  return { nickname: request.nickname };
}
