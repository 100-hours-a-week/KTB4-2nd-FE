'use client';

import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../config';
import type { ApiResponse } from '../types';
import { clearAuthSession, getAuthorizationValue, setAuthSession } from './authSession';

const REFRESH_TOKEN_PATH = '/users/token/refresh';

type RefreshToken = {
  accessToken: string;
  tokenType?: string;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string> | null = null;

function redirectToLogin() {
  clearAuthSession();
  window.location.replace('/login');
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100_000,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  const authorization = getAuthorizationValue();

  if (authorization) {
    config.headers.set('Authorization', authorization);
  }

  return config;
});

function refreshAccessToken() {
  refreshPromise ??= axios
    .post<ApiResponse<RefreshToken>>(`${API_BASE_URL}${REFRESH_TOKEN_PATH}`, null, {
      timeout: 100_000,
      withCredentials: true,
    })
    .then(({ data: response }) => {
      const { accessToken, tokenType } = response.data;

      if (!accessToken) {
        throw new Error('토큰 재발급 응답에 accessToken이 없습니다.');
      }

      setAuthSession({ accessToken, tokenType });

      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isRefreshRequest = originalRequest?.url?.includes(REFRESH_TOKEN_PATH) ?? false;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest ||
      originalRequest.skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();
      const authorization = getAuthorizationValue() ?? `Bearer ${accessToken}`;

      originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
      originalRequest.headers.set('Authorization', authorization);

      return apiClient(originalRequest);
    } catch (refreshError) {
      redirectToLogin();

      return Promise.reject(new Error('세션이 만료되었습니다.', { cause: refreshError }));
    }
  },
);
