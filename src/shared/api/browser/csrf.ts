'use client';

import axios from 'axios';

import { API_BASE_URL } from '../config';
import type { ApiResponse } from '../types';

const CSRF_TIMEOUT_MS = 100_000;

type CsrfToken = {
  headerName: string;
  token: string;
};

/** 상태 변경 요청(POST 등)에 필요한 CSRF 검증값을 백엔드에서 발급받습니다. */
export async function fetchCsrfToken(): Promise<string> {
  const { data } = await axios.get<ApiResponse<CsrfToken>>(`${API_BASE_URL}/auth/csrf`, {
    timeout: CSRF_TIMEOUT_MS,
    withCredentials: true,
  });
  const token = data.data?.token;

  if (!token) {
    throw new Error('CSRF 검증값을 받지 못했습니다.');
  }

  return token;
}
