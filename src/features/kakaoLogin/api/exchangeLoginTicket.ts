import type { ApiResponse } from '@/shared/api';
import { apiClient, fetchCsrfToken } from '@/shared/api/browser';

export type LoginExchangeResult =
  | {
      requiresNickname: false;
      expiresIn: number;
      user: { userId: number; email: string; nickname: string };
    }
  | { requiresNickname: true; expiresIn: number };

export async function exchangeLoginTicket(loginTicket: string): Promise<LoginExchangeResult> {
  const csrfToken = await fetchCsrfToken();
  const { data } = await apiClient.post<ApiResponse<LoginExchangeResult>>(
    '/auth/token/exchange',
    { loginTicket },
    { headers: { 'X-CSRF-TOKEN': csrfToken }, skipAuthRefresh: true },
  );

  return data.data;
}
