'use client';

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../config';

const REFRESH_TOKEN_PATH = '/users/token/refresh';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<void> | null = null;

function redirectToLogin() {
  window.location.replace('/login');
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100_000,
  withCredentials: true,
});

function refreshSession() {
  refreshPromise ??= axios
    .post(`${API_BASE_URL}${REFRESH_TOKEN_PATH}`, null, {
      timeout: 100_000,
      withCredentials: true,
    })
    .then(() => undefined)
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
      await refreshSession();

      return apiClient(originalRequest);
    } catch (refreshError) {
      redirectToLogin();

      return Promise.reject(new Error('세션이 만료되었습니다.', { cause: refreshError }));
    }
  },
);
