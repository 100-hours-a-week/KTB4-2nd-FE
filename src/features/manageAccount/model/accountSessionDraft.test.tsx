import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readTripCreateDraft,
  saveTripCreateDraft,
} from '@/features/createTrip/model/tripCreateDraft';
import { TRIP_CREATE_DEFAULT_VALUES } from '@/features/createTrip/model/types';
import { clearIdentity } from '@/shared/lib/analytics';
import { toast } from '@/shared/ui/toast';

import { logout } from '../api/logout';
import { withdraw } from '../api/withdraw';
import { redirectToLogin } from './redirectToLogin';
import { useLogout } from './useLogout';
import { useWithdraw } from './useWithdraw';

vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('@/shared/lib/analytics', () => ({ clearIdentity: vi.fn() }));
vi.mock('@/shared/ui/toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('../api/logout', () => ({ logout: vi.fn() }));
vi.mock('../api/withdraw', () => ({ withdraw: vi.fn() }));
vi.mock('./redirectToLogin', () => ({ redirectToLogin: vi.fn() }));

const draft = {
  ...TRIP_CREATE_DEFAULT_VALUES,
  tripName: '비밀 제주 여행',
  places: [{ regionCode: '50110', regionName: '제주시' }],
  startDate: '2026-10-07',
  endDate: '2026-10-09',
};

let draftAtRedirect: string | null | undefined;

function renderSessionHook(useHook: typeof useLogout) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(['user'], { id: 1 });
  const hook = renderHook(useHook, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...hook, client };
}

describe('계정 세션 종료 시 여행 초안 정리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftAtRedirect = undefined;
    window.localStorage.clear();
    saveTripCreateDraft(draft);
    window.localStorage.setItem('unrelated-preference', 'keep');
    vi.mocked(logout).mockResolvedValue(undefined);
    vi.mocked(withdraw).mockResolvedValue(undefined);
    vi.mocked(redirectToLogin).mockImplementation(() => {
      draftAtRedirect = window.localStorage.getItem('trip-create-draft-v1');
    });
  });

  it.each([
    ['로그아웃', useLogout],
    ['탈퇴', useWithdraw],
  ] as const)('%s 성공 시 로그인 이동 전에 초안과 캐시를 삭제한다', async (_, useHook) => {
    const { result, client } = renderSessionHook(useHook);
    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(redirectToLogin).toHaveBeenCalledOnce();
    expect(draftAtRedirect).toBeNull();
    expect(readTripCreateDraft()).toEqual(TRIP_CREATE_DEFAULT_VALUES);
    expect(window.localStorage.getItem('unrelated-preference')).toBe('keep');
    expect(clearIdentity).toHaveBeenCalledOnce();
    expect(client.getQueryData(['user'])).toBeUndefined();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('탈퇴 404 응답에서도 초안을 삭제하고 로그인으로 이동한다', async () => {
    const config = { headers: new AxiosHeaders() };
    const error = new AxiosError('already withdrawn', undefined, config, null, {
      status: 404,
      statusText: 'Not Found',
      data: null,
      headers: {},
      config,
    });
    vi.mocked(withdraw).mockRejectedValueOnce(error);
    const { result, client } = renderSessionHook(useWithdraw);
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBe(error);
    });

    expect(redirectToLogin).toHaveBeenCalledOnce();
    expect(draftAtRedirect).toBeNull();
    expect(readTripCreateDraft()).toEqual(TRIP_CREATE_DEFAULT_VALUES);
    expect(window.localStorage.getItem('unrelated-preference')).toBe('keep');
    expect(client.getQueryData(['user'])).toBeUndefined();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it.each([
    ['로그아웃', useLogout, logout],
    ['탈퇴', useWithdraw, withdraw],
  ] as const)('%s 일반 실패 시 초안과 세션을 유지한다', async (_, useHook, request) => {
    const error = new Error('network failed');
    vi.mocked(request).mockRejectedValueOnce(error);
    const { result, client } = renderSessionHook(useHook);
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBe(error);
    });

    expect(readTripCreateDraft()).toEqual(draft);
    expect(client.getQueryData(['user'])).toEqual({ id: 1 });
    expect(redirectToLogin).not.toHaveBeenCalled();
    expect(clearIdentity).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledOnce();
  });
});
