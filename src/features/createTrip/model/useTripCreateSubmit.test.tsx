import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchCsrfToken } from '@/shared/api/browser';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
import { createTrip } from '../api/createTrip';
import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';
import { uploadInitialAttachmentBatch } from '../api/uploadInitialAttachments';
import type { TripCreateFormValues } from './types';
import { useTripCreateSubmit } from './useTripCreateSubmit';

vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('../api/createTrip', () => ({ createTrip: vi.fn() }));
vi.mock('../api/cancelTripProcessing', () => ({ cancelTripProcessing: vi.fn() }));
vi.mock('../api/uploadInitialAttachments', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/uploadInitialAttachments')>()),
  uploadInitialAttachmentBatch: vi.fn(),
}));

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
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(uploaded());
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
    expect(uploadInitialAttachmentBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId: 7,
        files: [photo],
        batchNo: 1,
        totalAttachmentCount: 1,
        complete: true,
        csrfToken: 'csrf-token',
      }),
    );
  });

  it('사진이 10장을 넘으면 10장씩 나눠 순서대로 보낸다', async () => {
    const photos = Array.from(
      { length: 23 },
      (_, index) => new File(['photo'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
    );
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(null);
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValueOnce(null);
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValueOnce(null);
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValueOnce(uploaded());
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync({ ...values, attachments: photos }));

    const calls = vi.mocked(uploadInitialAttachmentBatch).mock.calls.map(([params]) => ({
      batchNo: params.batchNo,
      count: params.files.length,
      total: params.totalAttachmentCount,
      complete: params.complete,
    }));

    expect(calls).toEqual([
      { batchNo: 1, count: 10, total: 23, complete: false },
      { batchNo: 2, count: 10, total: 23, complete: false },
      { batchNo: 3, count: 3, total: 23, complete: true },
    ]);
  });

  it('마지막 묶음이 돌려준 처리 상태를 결과로 쓴다', async () => {
    const photos = Array.from(
      { length: 12 },
      (_, index) => new File(['photo'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
    );
    vi.mocked(uploadInitialAttachmentBatch)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(uploaded('FAILED'));
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    const status = await act(() => result.current.mutateAsync({ ...values, attachments: photos }));

    expect(status.status).toBe('FAILED');
  });

  it('묶음 진행률을 전체 눈금으로 환산한다', async () => {
    const photos = Array.from(
      { length: 20 },
      (_, index) => new File(['photo'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
    );
    // 첫 묶음이 절반까지만 올라간 뒤 멈추게 해서 중간 진행률을 관찰한다.
    vi.mocked(uploadInitialAttachmentBatch).mockImplementation(
      async ({ onUploadProgress }) =>
        new Promise(() => {
          onUploadProgress?.(0.5);
        }),
    );
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    act(() => result.current.mutate({ ...values, attachments: photos }));

    // 2묶음 중 1묶음이 50% → 전체 25%
    await waitFor(() => expect(result.current.uploadRatio).toBe(0.25));
  });

  it('사진 업로드 전에 새 CSRF 토큰을 받아 사용한다', async () => {
    vi.mocked(fetchCsrfToken)
      .mockResolvedValueOnce('create-csrf-token')
      .mockResolvedValueOnce('upload-csrf-token');
    vi.mocked(uploadInitialAttachmentBatch).mockImplementation(async ({ csrfToken }) => {
      if (csrfToken === 'create-csrf-token') throw new Error('CSRF_TOKEN_INVALID');
      return uploaded();
    });
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values));

    expect(fetchCsrfToken).toHaveBeenCalledTimes(2);
    expect(createTrip).toHaveBeenCalledWith(expect.any(Object), 'create-csrf-token');
    expect(uploadInitialAttachmentBatch).toHaveBeenCalledWith(
      expect.objectContaining({ csrfToken: 'upload-csrf-token' }),
    );
  });

  it('사진 업로드만 실패하면 다시 시도할 때 여행을 새로 만들지 않는다', async () => {
    vi.mocked(uploadInitialAttachmentBatch)
      .mockRejectedValueOnce(new Error('AI 분석 실패'))
      .mockResolvedValueOnce(uploaded());
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values).catch(() => undefined));
    await act(() => result.current.mutateAsync(values));

    expect(createTrip).toHaveBeenCalledOnce();
    expect(uploadInitialAttachmentBatch).toHaveBeenCalledTimes(2);
    expect(fetchCsrfToken).toHaveBeenCalledTimes(3);
  });

  it('여행 정보를 초기화하면 다음 시도에서 여행을 새로 만든다', async () => {
    vi.mocked(uploadInitialAttachmentBatch).mockRejectedValueOnce(new Error('AI 분석 실패'));
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values).catch(() => undefined));
    act(() => result.current.resetCreatedTrip());
    await act(() => result.current.mutateAsync(values).catch(() => undefined));

    expect(createTrip).toHaveBeenCalledTimes(2);
  });

  it('사진 분석 취소 시 진행 중인 요청을 중단하고 사진 단계로 돌아갈 수 있게 한다', async () => {
    let uploadSignal: AbortSignal | undefined;
    vi.mocked(uploadInitialAttachmentBatch).mockImplementation(async ({ signal }) => {
      uploadSignal = signal;

      return new Promise((resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        void resolve;
      });
    });
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
    vi.mocked(uploadInitialAttachmentBatch).mockImplementation(
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
    vi.mocked(uploadInitialAttachmentBatch).mockImplementation(
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
    vi.mocked(uploadInitialAttachmentBatch).mockImplementation(
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
