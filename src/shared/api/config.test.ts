import { afterEach, expect, it, vi } from 'vitest';

import { API_BASE_URL } from './config';
import { apiClient } from './browser/apiClient';

afterEach(() => vi.unstubAllEnvs());

it.each(['https://production.example', 'https://staging.example'])(
  '브라우저 요청은 %s의 /api를 사용한다',
  (origin) => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://legacy-production.example/api');
    vi.stubEnv('SERVER_API_BASE_URL', 'http://private-backend:8080/api');

    expect(API_BASE_URL).toBe('/api');
    expect(apiClient.getUri({ url: '/places' })).toBe('/api/places');
    expect(new URL(apiClient.getUri({ url: '/places' }), origin).href).toBe(`${origin}/api/places`);
    expect(apiClient.defaults.withCredentials).toBe(true);
  },
);
