import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchCsrfToken } from '@/shared/api/browser';

import { createTrip } from '../api/createTrip';
import { uploadInitialAttachments } from '../api/uploadInitialAttachments';
import type { TripCreateFormValues } from './types';
import { useTripCreateSubmit } from './useTripCreateSubmit';

vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('../api/createTrip', () => ({ createTrip: vi.fn() }));
vi.mock('../api/uploadInitialAttachments', () => ({ uploadInitialAttachments: vi.fn() }));

const photo = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
const values: TripCreateFormValues = {
  tripName: '제주 여행',
  places: [{ regionCode: '50110', regionName: '제주특별자치도 제주시' }],
  startDate: '2026-09-01',
  endDate: '2026-09-03',
  attachments: [photo],
};

function wrapper({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useTripCreateSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTrip).mockResolvedValue({ tripId: 7, status: 'PROCESSING' });
  });

  it('여행을 만든 뒤 같은 tripId로 사진을 올린다', async () => {
    vi.mocked(uploadInitialAttachments).mockResolvedValue({
      tripId: 7,
      status: 'COMPLETED',
      totalAttachments: 1,
    });
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values));

    expect(createTrip).toHaveBeenCalledWith(
      {
        tripName: '제주 여행',
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        regionCodes: ['50110'],
      },
      'csrf-token',
    );
    expect(uploadInitialAttachments).toHaveBeenCalledWith(
      7,
      [photo],
      'csrf-token',
      expect.any(Function),
    );
  });

  it('사진 업로드 전에 새 CSRF 토큰을 받아 사용한다', async () => {
    vi.mocked(fetchCsrfToken)
      .mockResolvedValueOnce('create-csrf-token')
      .mockResolvedValueOnce('upload-csrf-token');
    vi.mocked(uploadInitialAttachments).mockImplementation(async (_tripId, _files, csrfToken) => {
      if (csrfToken === 'create-csrf-token') throw new Error('CSRF_TOKEN_INVALID');
      return { tripId: 7, status: 'COMPLETED', totalAttachments: 1 };
    });
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values));

    expect(fetchCsrfToken).toHaveBeenCalledTimes(2);
    expect(createTrip).toHaveBeenCalledWith(expect.any(Object), 'create-csrf-token');
    expect(uploadInitialAttachments).toHaveBeenCalledWith(
      7,
      [photo],
      'upload-csrf-token',
      expect.any(Function),
    );
  });

  it('사진 업로드만 실패하면 다시 시도할 때 여행을 새로 만들지 않는다', async () => {
    vi.mocked(uploadInitialAttachments)
      .mockRejectedValueOnce(new Error('AI 분석 실패'))
      .mockResolvedValueOnce({ tripId: 7, status: 'COMPLETED', totalAttachments: 1 });
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values).catch(() => undefined));
    await act(() => result.current.mutateAsync(values));

    expect(createTrip).toHaveBeenCalledOnce();
    expect(uploadInitialAttachments).toHaveBeenCalledTimes(2);
    expect(fetchCsrfToken).toHaveBeenCalledTimes(3);
  });

  it('여행 정보를 초기화하면 다음 시도에서 여행을 새로 만든다', async () => {
    vi.mocked(uploadInitialAttachments).mockRejectedValueOnce(new Error('AI 분석 실패'));
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values).catch(() => undefined));
    act(() => result.current.resetCreatedTrip());
    await act(() => result.current.mutateAsync(values).catch(() => undefined));

    expect(createTrip).toHaveBeenCalledTimes(2);
  });
});
