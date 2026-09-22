import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each([
  ['http://localhost:8080', 'http://localhost:8080/api'],
  ['http://localhost:8080/api', 'http://localhost:8080/api'],
  ['http://localhost:8080/api/', 'http://localhost:8080/api'],
])('API 주소 %s에서 /api 경로를 한 번만 사용한다', async (configuredUrl, expectedBaseUrl) => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', configuredUrl);
  vi.resetModules();

  const { API_BASE_URL } = await import('./config');
  const { apiClient } = await import('./browser/apiClient');

  expect(API_BASE_URL).toBe(expectedBaseUrl);
  expect(apiClient.getUri({ url: '/places' })).toBe(`${expectedBaseUrl}/places`);
});
