import { afterEach, expect, it, vi } from 'vitest';
import { AxiosHeaders, type AxiosAdapter } from 'axios';
import { cookies } from 'next/headers';

import { createServerApiClient } from './serverApiClient';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

function mockCookies(value: string) {
  vi.mocked(cookies).mockResolvedValue({ toString: () => value } as Awaited<
    ReturnType<typeof cookies>
  >);
}

it('모듈 로드 후에도 각 요청의 런타임 주소와 쿠키를 사용한다', async () => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://legacy-production.example/api');
  vi.stubEnv('SERVER_API_BASE_URL', 'http://staging-backend:8080/api/');
  mockCookies('accessToken=staging-session');
  const staging = await createServerApiClient();

  vi.stubEnv('SERVER_API_BASE_URL', 'https://production-backend.example/api');
  mockCookies('accessToken=production-session');
  const production = await createServerApiClient();

  expect(staging.getUri({ url: '/users/me' })).toBe('http://staging-backend:8080/api/users/me');
  expect(production.getUri({ url: '/trips/7' })).toBe(
    'https://production-backend.example/api/trips/7',
  );
  expect(staging.defaults.headers.Cookie).toBe('accessToken=staging-session');
  expect(production.defaults.headers.Cookie).toBe('accessToken=production-session');

  const adapter = vi.fn<AxiosAdapter>(async (config) => ({
    config,
    data: {},
    headers: new AxiosHeaders(),
    status: 200,
    statusText: 'OK',
  }));
  await staging.get('/users/me', { adapter });
  expect(adapter.mock.calls[0][0].baseURL).toBe('http://staging-backend:8080/api');
  expect(adapter.mock.calls[0][0].headers.get('Cookie')).toBe('accessToken=staging-session');
});

it('쿠키가 없는 요청에 다른 요청의 쿠키를 전달하지 않는다', async () => {
  vi.stubEnv('SERVER_API_BASE_URL', 'http://backend:8080/api');
  mockCookies('');
  const client = await createServerApiClient();
  expect(client.defaults.headers.Cookie).toBeUndefined();
});

it.each([
  '',
  '/api',
  'not-a-url',
  'ftp://backend/api',
  'https://user:password@backend/api',
  'https://backend/api?key=secret',
  'https://backend/api#fragment',
])('잘못된 서버 주소 %s이면 요청 전에 실패한다', async (value) => {
  vi.stubEnv('SERVER_API_BASE_URL', value);
  mockCookies('');
  await expect(createServerApiClient()).rejects.toThrow('SERVER_API_BASE_URL');
});
