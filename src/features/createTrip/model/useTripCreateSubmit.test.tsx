import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchCsrfToken } from '@/shared/api/browser';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
import { createTrip } from '../api/createTrip';
import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';
import { uploadInitialAttachments } from '../api/uploadInitialAttachments';
import type { TripCreateFormValues } from './types';
import { useTripCreateSubmit } from './useTripCreateSubmit';

vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('../api/createTrip', () => ({ createTrip: vi.fn() }));
vi.mock('../api/cancelTripProcessing', () => ({ cancelTripProcessing: vi.fn() }));
vi.mock('../api/uploadInitialAttachments', () => ({ uploadInitialAttachments: vi.fn() }));

const photo = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
const values: TripCreateFormValues = {
  tripName: '제주 여행',
  places: [{ regionCode: '50110', regionName: '제주특별자치도 제주시' }],
  startDate: '2026-09-01',
  endDate: '2026-09-03',
  attachments: [photo],
};

function uploaded(
  status: TripProcessingStatusResponse['status'] = 'COMPLETED',
): TripProcessingStatusResponse {
  return { tripId: 7, status, progress: null, currentStep: null, result: null, error: null };
}

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
    vi.mocked(uploadInitialAttachments).mockResolvedValue(uploaded());
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
      expect.any(AbortSignal),
    );
  });

  it('사진 업로드 전에 새 CSRF 토큰을 받아 사용한다', async () => {
    vi.mocked(fetchCsrfToken)
      .mockResolvedValueOnce('create-csrf-token')
      .mockResolvedValueOnce('upload-csrf-token');
    vi.mocked(uploadInitialAttachments).mockImplementation(async (_tripId, _files, csrfToken) => {
      if (csrfToken === 'create-csrf-token') throw new Error('CSRF_TOKEN_INVALID');
      return uploaded();
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
      expect.any(AbortSignal),
    );
  });

  it('사진 업로드만 실패하면 다시 시도할 때 여행을 새로 만들지 않는다', async () => {
    vi.mocked(uploadInitialAttachments)
      .mockRejectedValueOnce(new Error('AI 분석 실패'))
      .mockResolvedValueOnce(uploaded());
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

  it('사진 분석 취소 시 진행 중인 요청을 중단하고 사진 단계로 돌아갈 수 있게 한다', async () => {
    let uploadSignal: AbortSignal | undefined;
    vi.mocked(uploadInitialAttachments).mockImplementation(
      async (_tripId, _files, _csrfToken, _onUploadProgress, signal) => {
        uploadSignal = signal;

        return new Promise((resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
          void resolve;
        });
      },
    );
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    act(() => result.current.mutate(values));
    await waitFor(() => expect(result.current.tripId).toBe(7));

    act(() => result.current.cancelProcessing());

    expect(uploadSignal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.uploadRatio).toBe(0);
  });

  it('취소하면 CSRF 토큰과 함께 정리 취소 API를 호출한다', async () => {
    vi.mocked(cancelTripProcessing).mockResolvedValue(undefined);
    vi.mocked(uploadInitialAttachments).mockImplementation(
      () => new Promise(() => undefined) as Promise<never>,
    );
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    act(() => result.current.mutate(values));
    await waitFor(() => expect(result.current.tripId).toBe(7));

    act(() => result.current.cancelProcessing());

    await waitFor(() => expect(cancelTripProcessing).toHaveBeenCalledWith(7, 'csrf-token'));
  });

  it('취소에 성공하면 다음 시도는 새 여행으로 만든다', async () => {
    vi.mocked(cancelTripProcessing).mockResolvedValue(undefined);
    vi.mocked(uploadInitialAttachments).mockImplementation(
      () => new Promise(() => undefined) as Promise<never>,
    );
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    act(() => result.current.mutate(values));
    await waitFor(() => expect(result.current.tripId).toBe(7));

    act(() => result.current.cancelProcessing());

    // 취소된 여행은 CANCELED라 재업로드가 막히므로 tripId를 비운다.
    await waitFor(() => expect(result.current.tripId).toBeNull());
  });

  it('취소에 실패하면 여행 ID를 남겨 재시도할 수 있게 한다', async () => {
    vi.mocked(cancelTripProcessing).mockRejectedValue(new Error('failed'));
    vi.mocked(uploadInitialAttachments).mockImplementation(
      () => new Promise(() => undefined) as Promise<never>,
    );
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    act(() => result.current.mutate(values));
    await waitFor(() => expect(result.current.tripId).toBe(7));

    act(() => result.current.cancelProcessing());

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.tripId).toBe(7);
  });
});
