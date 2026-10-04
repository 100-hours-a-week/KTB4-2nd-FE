import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchCsrfToken } from '@/shared/api/browser';
import { EVENTS, track } from '@/shared/lib/analytics';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
import { createTrip } from '../api/createTrip';
import {
  getTripProcessingStatus,
  type TripProcessingStatusResponse,
} from '../api/getTripProcessingStatus';
import { uploadInitialAttachmentBatch } from '../api/uploadInitialAttachments';
import type { TripCreateFormValues } from './types';
import { useTripCreateSubmit } from './useTripCreateSubmit';

vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('@/shared/lib/analytics', () => ({
  EVENTS: {
    TRIP_CREATE: 'trip_create',
    PHOTO_UPLOAD_START: 'photo_upload_start',
    PHOTO_UPLOAD_COMPLETE: 'photo_upload_complete',
    LOCATION_RESTORE_COMPLETE: 'location_restore_complete',
    DIARY_GENERATE_COMPLETE: 'diary_generate_complete',
  },
  track: vi.fn(),
}));
vi.mock('../api/createTrip', () => ({ createTrip: vi.fn() }));
vi.mock('../api/cancelTripProcessing', () => ({ cancelTripProcessing: vi.fn() }));
vi.mock('../api/getTripProcessingStatus', () => ({ getTripProcessingStatus: vi.fn() }));
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

function completed(): TripProcessingStatusResponse {
  return {
    ...uploaded(),
    result: {
      tripId: 7,
      placeFolderCount: 1,
      classifiedAttachmentCount: 1,
      unclassifiedAttachmentCount: 0,
    },
  };
}

function diaryCompletionCalls() {
  return vi.mocked(track).mock.calls.filter(([event]) => event === EVENTS.DIARY_GENERATE_COMPLETE);
}

function wrapper({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useTripCreateSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTrip).mockResolvedValue({ tripId: 7, status: 'PROCESSING' });
    vi.mocked(getTripProcessingStatus).mockResolvedValue(uploaded('PROCESSING'));
  });

  afterEach(() => vi.restoreAllMocks());

  it('일기 생성 시간은 전체 업로드가 아닌 마지막 Batch 요청부터 계산한다', async () => {
    let now = 10_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const photos = Array.from({ length: 11 }, () => new File(['photo'], 'photo.jpg'));
    vi.mocked(uploadInitialAttachmentBatch).mockImplementation(async ({ complete }) => {
      now += complete ? 2_400 : 9_000;
      return complete ? completed() : null;
    });
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync({ ...values, attachments: photos }));

    expect(diaryCompletionCalls()).toEqual([
      [EVENTS.DIARY_GENERATE_COMPLETE, { photo_count: 11, generation_time_sec: 2 }],
    ]);
  });

  it('마지막 응답이 PROCESSING이면 완료를 기다리고 폴링 완료 시 한 번 기록한다', async () => {
    let resolveStatus!: (status: TripProcessingStatusResponse) => void;
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(uploaded('PROCESSING'));
    vi.mocked(getTripProcessingStatus).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveStatus = resolve;
        }),
    );
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values));
    await waitFor(() => expect(getTripProcessingStatus).toHaveBeenCalledWith(7));
    expect(result.current.isPending).toBe(true);
    expect(result.current.processingResult).toBeNull();
    expect(diaryCompletionCalls()).toHaveLength(0);

    await act(async () => resolveStatus(completed()));

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.processingResult?.status).toBe('COMPLETED');
    expect(diaryCompletionCalls()).toEqual([
      [EVENTS.DIARY_GENERATE_COMPLETE, { photo_count: 1, generation_time_sec: expect.any(Number) }],
    ]);
    expect(track).toHaveBeenCalledWith(EVENTS.LOCATION_RESTORE_COMPLETE, {
      photo_count: 1,
      restored_count: 1,
      failed_count: 0,
    });
  });

  it('완료된 여행을 다시 제출해도 완료 이벤트를 중복 전송하지 않는다', async () => {
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(completed());
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values));
    await act(() =>
      result.current.mutateAsync({
        ...values,
        attachments: [new File(['other'], 'other.jpg')],
      }),
    );

    expect(diaryCompletionCalls()).toHaveLength(1);
    expect(
      vi.mocked(track).mock.calls.filter(([event]) => event === EVENTS.LOCATION_RESTORE_COMPLETE),
    ).toHaveLength(1);
  });

  it('새 여행을 만들면 완료 이벤트도 새로 기록한다', async () => {
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(completed());
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values));
    act(() => result.current.resetCreatedTrip());
    await act(() => result.current.mutateAsync(values));

    expect(diaryCompletionCalls()).toHaveLength(2);
  });

  it.each(['FAILED', 'CANCELED'] as const)(
    '폴링 결과가 %s면 대기를 끝내고 완료 이벤트는 보내지 않는다',
    async (status) => {
      vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(uploaded('PROCESSING'));
      vi.mocked(getTripProcessingStatus).mockResolvedValue(uploaded(status));
      const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

      await act(() => result.current.mutateAsync(values));

      await waitFor(() => expect(result.current.processingResult?.status).toBe(status));
      expect(result.current.isPending).toBe(false);
      expect(diaryCompletionCalls()).toHaveLength(0);
    },
  );

  it('결과 없는 COMPLETED 응답은 일기 완료 이벤트를 보내지 않는다', async () => {
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(uploaded());
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });
    await act(() => result.current.mutateAsync(values));
    expect(diaryCompletionCalls()).toHaveLength(0);
  });

  it('마지막 Batch 요청 실패 후 재시도하면 재요청 시점부터 생성 시간을 계산한다', async () => {
    let now = 10_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    vi.mocked(uploadInitialAttachmentBatch)
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockImplementationOnce(async () => {
        now += 1_600;
        return completed();
      });
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values).catch(() => undefined));
    expect(diaryCompletionCalls()).toHaveLength(0);
    now += 60_000;
    await act(() => result.current.mutateAsync(values));

    expect(diaryCompletionCalls()).toEqual([
      [EVENTS.DIARY_GENERATE_COMPLETE, { photo_count: 1, generation_time_sec: 2 }],
    ]);
  });

  it('취소한 뒤 늦게 도착한 폴링 완료 응답은 기록하지 않는다', async () => {
    let resolveStatus!: (status: TripProcessingStatusResponse) => void;
    vi.mocked(cancelTripProcessing).mockResolvedValue(undefined);
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(uploaded('PROCESSING'));
    vi.mocked(getTripProcessingStatus).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveStatus = resolve;
        }),
    );
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync(values));
    await waitFor(() => expect(getTripProcessingStatus).toHaveBeenCalled());
    act(() => result.current.cancelProcessing());
    await waitFor(() => expect(result.current.tripId).toBeNull());
    await act(async () => resolveStatus(completed()));

    expect(result.current.processingResult).toBeNull();
    expect(diaryCompletionCalls()).toHaveLength(0);
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
    expect(track).toHaveBeenCalledWith(EVENTS.TRIP_CREATE, { trip_region: '제주시' });
    expect(track).toHaveBeenCalledWith(EVENTS.PHOTO_UPLOAD_START, { photo_count: 1 });
    expect(track).toHaveBeenCalledWith(EVENTS.PHOTO_UPLOAD_COMPLETE, {
      photo_count: 1,
      upload_duration_sec: expect.any(Number),
    });
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

  it('위치 복원 결과를 받은 뒤 성공·실패 사진 수를 기록한다', async () => {
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue({
      tripId: 7,
      status: 'COMPLETED',
      progress: null,
      currentStep: null,
      result: {
        tripId: 7,
        placeFolderCount: 2,
        classifiedAttachmentCount: 8,
        unclassifiedAttachmentCount: 2,
      },
      error: null,
    });
    const photos = Array.from(
      { length: 10 },
      (_, index) => new File(['photo'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
    );
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() => result.current.mutateAsync({ ...values, attachments: photos }));

    expect(track).toHaveBeenCalledWith(EVENTS.LOCATION_RESTORE_COMPLETE, {
      photo_count: 10,
      restored_count: 8,
      failed_count: 2,
    });
  });

  it('중간 묶음이 실패하면 다음 시도는 실패한 묶음부터 이어 보낸다', async () => {
    const photos = Array.from(
      { length: 23 },
      (_, index) => new File(['photo'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
    );
    vi.mocked(uploadInitialAttachmentBatch)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('네트워크 끊김'))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(uploaded());
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() =>
      result.current.mutateAsync({ ...values, attachments: photos }).catch(() => undefined),
    );
    await act(() => result.current.mutateAsync({ ...values, attachments: photos }));

    const batchNumbers = vi
      .mocked(uploadInitialAttachmentBatch)
      .mock.calls.map(([params]) => params.batchNo);

    expect(batchNumbers).toEqual([1, 2, 2, 3]);
    expect(track).toHaveBeenCalledWith(EVENTS.TRIP_CREATE, { trip_region: '제주시' });
    expect(vi.mocked(track).mock.calls.filter(([event]) => event === 'trip_create')).toHaveLength(
      1,
    );
    expect(
      vi.mocked(track).mock.calls.filter(([event]) => event === 'photo_upload_start'),
    ).toHaveLength(1);
    expect(
      vi.mocked(track).mock.calls.filter(([event]) => event === 'photo_upload_complete'),
    ).toHaveLength(1);
  });

  it('이어 보낼 때 이미 올린 묶음만큼 진행률을 채운 상태로 시작한다', async () => {
    const photos = Array.from(
      { length: 20 },
      (_, index) => new File(['photo'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
    );
    vi.mocked(uploadInitialAttachmentBatch)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('네트워크 끊김'))
      .mockImplementation(() => new Promise(() => undefined) as Promise<never>);
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() =>
      result.current.mutateAsync({ ...values, attachments: photos }).catch(() => undefined),
    );
    act(() => result.current.mutate({ ...values, attachments: photos }));

    await waitFor(() => expect(result.current.uploadRatio).toBe(0.5));
  });

  it('사진 선택이 바뀌면 이어 보내지 않고 처음부터 다시 보낸다', async () => {
    const photos = Array.from(
      { length: 20 },
      (_, index) => new File(['photo'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
    );
    vi.mocked(uploadInitialAttachmentBatch)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('네트워크 끊김'))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(uploaded());
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() =>
      result.current.mutateAsync({ ...values, attachments: photos }).catch(() => undefined),
    );
    await act(() => result.current.mutateAsync({ ...values, attachments: [...photos].reverse() }));

    const batchNumbers = vi
      .mocked(uploadInitialAttachmentBatch)
      .mock.calls.map(([params]) => params.batchNo);

    expect(batchNumbers).toEqual([1, 2, 1, 2]);
  });

  it('여행 정보를 초기화하면 이어 보내기 지점도 함께 비운다', async () => {
    const photos = Array.from(
      { length: 20 },
      (_, index) => new File(['photo'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
    );
    vi.mocked(uploadInitialAttachmentBatch)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('네트워크 끊김'))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(uploaded());
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    await act(() =>
      result.current.mutateAsync({ ...values, attachments: photos }).catch(() => undefined),
    );
    act(() => result.current.resetCreatedTrip());
    await act(() => result.current.mutateAsync({ ...values, attachments: photos }));

    const batchNumbers = vi
      .mocked(uploadInitialAttachmentBatch)
      .mock.calls.map(([params]) => params.batchNo);

    expect(batchNumbers).toEqual([1, 2, 1, 2]);
  });

  it('묶음 진행률을 전체 눈금으로 환산한다', async () => {
    const photos = Array.from(
      { length: 20 },
      (_, index) => new File(['photo'], `photo-${index}.jpg`, { type: 'image/jpeg' }),
    );
    vi.mocked(uploadInitialAttachmentBatch).mockImplementation(
      async ({ onUploadProgress }) =>
        new Promise(() => {
          onUploadProgress?.(0.5);
        }),
    );
    const { result } = renderHook(() => useTripCreateSubmit(), { wrapper });

    act(() => result.current.mutate({ ...values, attachments: photos }));

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
