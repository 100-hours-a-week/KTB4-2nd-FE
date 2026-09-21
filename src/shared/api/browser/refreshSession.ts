'use client';

import axios from 'axios';

import { API_BASE_URL } from '../config';
import { fetchCsrfToken } from './csrf';

const REFRESH_TIMEOUT_MS = 100_000;

let refreshPromise: Promise<void> | null = null;

/** 브라우저가 백엔드에 직접 쿠키를 보내 세션을 갱신합니다. */
export function refreshSession(): Promise<void> {
  refreshPromise ??= (async () => {
    const csrfToken = await fetchCsrfToken();

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
