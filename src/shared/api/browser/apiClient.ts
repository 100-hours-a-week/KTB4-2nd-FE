'use client';

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../config';
import { refreshSession } from './refreshSession';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function redirectToLogin() {
  window.location.replace('/login');
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100_000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshSession();

      return apiClient(originalRequest);
    } catch (refreshError) {
      if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
        redirectToLogin();
      }

      return Promise.reject(refreshError);
    }
  },
);
