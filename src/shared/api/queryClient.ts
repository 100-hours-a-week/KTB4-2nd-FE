import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

function shouldRetryRequest(failureCount: number, error: unknown) {
  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (status !== undefined && status < 500) {
      return false;
    }
  }

  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryRequest,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }

  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}
