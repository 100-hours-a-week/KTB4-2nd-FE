import axios, { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios';
import { afterEach, expect, test, vi } from 'vitest';

import { API_BASE_URL } from '../config';
import { apiClient } from './apiClient';

afterEach(() => {
  vi.restoreAllMocks();
});

test('동시에 401을 받은 요청은 세션을 한 번 갱신한 뒤 각각 한 번 재실행한다', async () => {
  let renewed = false;
  let finishRefresh!: () => void;
  const refreshGate = new Promise<void>((resolve) => {
    finishRefresh = resolve;
  });

  const csrf = vi.spyOn(axios, 'get').mockResolvedValue({
    data: { data: { token: 'test-csrf-token' } },
  });
  const refresh = vi.spyOn(axios, 'post').mockImplementation(async () => {
    await refreshGate;
    renewed = true;
    return { status: 204 };
  });

  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    const response = {
      config,
      data: { ok: renewed },
      headers: new AxiosHeaders(),
      status: renewed ? 200 : 401,
      statusText: renewed ? 'OK' : 'Unauthorized',
    };

    if (!renewed) {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response);
    }

    return response;
  });

  const requests = [apiClient.get('/first', { adapter }), apiClient.get('/second', { adapter })];

  await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  finishRefresh();

  const responses = await Promise.all(requests);

  expect(responses.map(({ data }) => data)).toEqual([{ ok: true }, { ok: true }]);
  expect(csrf).toHaveBeenCalledOnce();
  expect(csrf).toHaveBeenCalledWith(`${API_BASE_URL}/auth/csrf`, {
    timeout: 100_000,
    withCredentials: true,
  });
  expect(refresh).toHaveBeenCalledWith(`${API_BASE_URL}/auth/token/refresh`, null, {
    timeout: 100_000,
    withCredentials: true,
    headers: { 'X-CSRF-TOKEN': 'test-csrf-token' },
  });
  expect(adapter).toHaveBeenCalledTimes(4);
});

test('갱신 서버 오류는 원래 요청을 재실행하지 않고 오류를 전달한다', async () => {
  vi.spyOn(axios, 'get').mockResolvedValue({
    data: { data: { token: 'test-csrf-token' } },
  });
  const refreshError = new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, {
    config: { headers: new AxiosHeaders() },
    data: null,
    headers: new AxiosHeaders(),
    status: 503,
    statusText: 'Unavailable',
  });

  vi.spyOn(axios, 'post').mockRejectedValue(refreshError);

  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
      config,
      data: null,
      headers: new AxiosHeaders(),
      status: 401,
      statusText: 'Unauthorized',
    });
  });

  await expect(apiClient.get('/private', { adapter })).rejects.toBe(refreshError);
  expect(adapter).toHaveBeenCalledTimes(1);
});
