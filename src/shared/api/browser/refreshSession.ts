'use client';

import axios from 'axios';

import { API_BASE_URL } from '../config';
import type { ApiResponse } from '../types';

const REFRESH_TIMEOUT_MS = 100_000;

type CsrfToken = {
  token: string;
};

let refreshPromise: Promise<void> | null = null;

/** 브라우저가 백엔드에 직접 쿠키를 보내 세션을 갱신합니다. */
export function refreshSession(): Promise<void> {
  refreshPromise ??= (async () => {
    const { data: csrfResponse } = await axios.get<ApiResponse<CsrfToken>>(
      `${API_BASE_URL}/auth/csrf`,
      { timeout: REFRESH_TIMEOUT_MS, withCredentials: true },
    );
    const csrfToken = csrfResponse.data?.token;

    if (!csrfToken) {
      throw new Error('CSRF 검증값을 받지 못했습니다.');
    }

    await axios.post(`${API_BASE_URL}/auth/token/refresh`, null, {
      timeout: REFRESH_TIMEOUT_MS,
      withCredentials: true,
      headers: { 'X-CSRF-TOKEN': csrfToken },
    });
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
