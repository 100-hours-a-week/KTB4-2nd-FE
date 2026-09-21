import type { ApiResponse } from '@/shared/api';
import { apiClient, fetchCsrfToken } from '@/shared/api/browser';

export type CompleteSignupRequest = {
  nickname: string;
};

export type CompleteSignupResponse = {
  userId: number;
  nickname: string;
  expiresIn: number;
};

/** 로그인 교환 때 받은 profileToken 쿠키로 닉네임을 등록하고 로그인 세션을 발급받습니다. */
export async function completeSignup(
  request: CompleteSignupRequest,
): Promise<CompleteSignupResponse> {
  const csrfToken = await fetchCsrfToken();
  const { data } = await apiClient.post<ApiResponse<CompleteSignupResponse>>(
    '/users/me/profile',
    request,
    { headers: { 'X-CSRF-TOKEN': csrfToken }, skipAuthRefresh: true },
  );

  return data.data;
}
