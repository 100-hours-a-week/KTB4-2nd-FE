import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EVENTS, track } from '@/shared/lib/analytics';
import { toast } from '@/shared/ui/toast';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
import { createTrip } from '../api/createTrip';
import {
  getTripProcessingStatus,
  type TripProcessingStatusResponse,
} from '../api/getTripProcessingStatus';
import { uploadInitialAttachmentBatch } from '../api/uploadInitialAttachments';
import { saveTripCreateDraft } from '../model/tripCreateDraft';
import type { TripCreateFormValues } from '../model/types';
import { hasAnyPhotoLocation } from '../model/hasAnyPhotoLocation';
import { TripCreateForm } from './tripCreateForm';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn() }),
}));
vi.mock('@/shared/api/browser', () => ({ fetchCsrfToken: vi.fn().mockResolvedValue('csrf') }));
vi.mock('@/shared/lib/analytics', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/analytics')>()),
  track: vi.fn(),
}));
vi.mock('@/shared/ui/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock('../api/createTrip', () => ({ createTrip: vi.fn() }));
vi.mock('../api/cancelTripProcessing', () => ({ cancelTripProcessing: vi.fn() }));
vi.mock('@/features/tripDetail/api/deleteTrip', () => ({ deleteTrip: vi.fn() }));
vi.mock('../model/hasAnyPhotoLocation', () => ({ hasAnyPhotoLocation: vi.fn() }));
vi.mock('../api/getTripProcessingStatus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/getTripProcessingStatus')>()),
  getTripProcessingStatus: vi.fn(),
}));
vi.mock('../api/uploadInitialAttachments', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/uploadInitialAttachments')>()),
  uploadInitialAttachmentBatch: vi.fn(),
}));
vi.mock('./components/tripImageStep', () => ({
  TripImageStep: function TestImageStep() {
    const { setValue } = useFormContext<TripCreateFormValues>();
    return (
      <button
        type="submit"
        onClick={() => setValue('attachments', [new File(['photo'], 'photo.jpg')])}
      >
        여행 만들기
      </button>
    );
  },
}));
vi.mock('./components/tripProcessingView', () => ({
  TripProcessingView: () => <div>처리 중</div>,
}));

const processing: TripProcessingStatusResponse = {
  tripId: 7,
  status: 'PROCESSING',
  progress: null,
  currentStep: null,
  result: null,
  error: null,
};
const completed: TripProcessingStatusResponse = {
  ...processing,
  status: 'COMPLETED',
  result: {
    tripId: 7,
    placeFolderCount: 1,
    classifiedAttachmentCount: 1,
    unclassifiedAttachmentCount: 0,
  },
};

async function submitForm() {
  const user = userEvent.setup();
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <TripCreateForm initialStep="images" />
    </QueryClientProvider>,
  );
  await user.click(await screen.findByRole('button', { name: '여행 만들기' }));
}

describe('TripCreateForm 생성 완료 이벤트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasAnyPhotoLocation).mockReset().mockResolvedValue(true);
    window.localStorage.clear();
    window.history.replaceState(null, '', '/trips/create?step=images');
    saveTripCreateDraft({
      tripName: '제주 여행',
      places: [{ regionCode: '50110', regionName: '제주특별자치도 제주시' }],
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      attachments: [],
    });
    vi.mocked(createTrip).mockResolvedValue({ tripId: 7, status: 'PROCESSING' });
    vi.mocked(getTripProcessingStatus).mockResolvedValue(processing);
  });

  it('모든 사진에 위치 정보가 없으면 모달을 띄우고 생성과 업로드를 막는다', async () => {
    vi.mocked(hasAnyPhotoLocation).mockResolvedValue(false);
    await submitForm();

    expect(
      await screen.findByRole('dialog', { name: '모든 사진에 위치 정보가 없어요' }),
    ).toBeInTheDocument();
    expect(createTrip).not.toHaveBeenCalled();
    expect(uploadInitialAttachmentBatch).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole('button', { name: '확인' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('trip-create-draft-v1')).toContain('제주 여행');
  });

  it('검사가 끝나기 전에 다시 제출해도 검사를 중복 실행하지 않는다', async () => {
    let resolveCheck!: (value: boolean) => void;
    vi.mocked(hasAnyPhotoLocation).mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveCheck = resolve;
        }),
    );
    await submitForm();
    expect(screen.getByRole('button', { name: '여행 만들기' })).toBeDisabled();
    await userEvent.setup().click(screen.getByRole('button', { name: '여행 만들기' }));
    expect(hasAnyPhotoLocation).toHaveBeenCalledTimes(1);
    await act(async () => resolveCheck(false));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('읽기 실패 시 위치 정보 없음 모달 대신 검사 오류를 안내한다', async () => {
    vi.mocked(hasAnyPhotoLocation).mockRejectedValue(new Error('read failure'));
    await submitForm();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        '사진의 위치 정보를 확인하지 못했어요. 다시 시도해주세요.',
      ),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(createTrip).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '여행 만들기' })).toBeEnabled();
  });

  it('업로드 실패 뒤 사진 목록을 바꿔 다시 제출하면 이전 여행을 버리고 새 여행으로 업로드한다', async () => {
    vi.mocked(createTrip)
      .mockResolvedValueOnce({ tripId: 7, status: 'PROCESSING' })
      .mockResolvedValueOnce({ tripId: 8, status: 'PROCESSING' });
    vi.mocked(uploadInitialAttachmentBatch)
      .mockRejectedValueOnce(new Error('invalid file'))
      .mockResolvedValueOnce({ ...completed, tripId: 8 });
    await submitForm();
    await waitFor(() => expect(uploadInitialAttachmentBatch).toHaveBeenCalledTimes(1));

    // 테스트용 사진 단계는 누를 때마다 새 사진 목록으로 바꿉니다.
    await userEvent.setup().click(await screen.findByRole('button', { name: '여행 만들기' }));

    await waitFor(() => expect(uploadInitialAttachmentBatch).toHaveBeenCalledTimes(2));
    expect(createTrip).toHaveBeenCalledTimes(2);
    // 버린 여행(7)이 남아 있으면 같은 이름으로 새로 만들 때 이름 중복(409)이 나므로 먼저 정리합니다.
    expect(cancelTripProcessing).toHaveBeenCalledWith(7, 'csrf');
    expect(vi.mocked(cancelTripProcessing).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(createTrip).mock.invocationCallOrder[1],
    );
    expect(vi.mocked(uploadInitialAttachmentBatch).mock.calls[1][0]).toMatchObject({
      tripId: 8,
      batchNo: 1,
    });
  });

  it('Batch에서 완료되면 이벤트를 보내고 한 번만 완료 안내·이동한다', async () => {
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(completed);
    await submitForm();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('여행을 만들었어요.');
    expect(track).toHaveBeenCalledWith(EVENTS.DIARY_GENERATE_COMPLETE, {
      photo_count: 1,
      generation_time_sec: expect.any(Number),
    });
  });

  it('PROCESSING에서는 실패 안내 없이 대기하다 폴링 완료 후 이벤트·이동한다', async () => {
    let resolveStatus!: (status: TripProcessingStatusResponse) => void;
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(processing);
    vi.mocked(getTripProcessingStatus).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveStatus = resolve;
        }),
    );
    await submitForm();

    await waitFor(() => expect(getTripProcessingStatus).toHaveBeenCalledWith(7));
    expect(screen.getByText('처리 중')).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    await act(async () => resolveStatus(completed));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(track).mock.calls.filter(([event]) => event === EVENTS.DIARY_GENERATE_COMPLETE),
    ).toHaveLength(1);
    expect(window.localStorage.getItem('trip-create-draft-v1')).toBeNull();
  });

  it('폴링에서 FAILED가 오면 실패 안내만 표시하고 완료 이벤트·이동은 하지 않는다', async () => {
    vi.mocked(uploadInitialAttachmentBatch).mockResolvedValue(processing);
    vi.mocked(getTripProcessingStatus).mockResolvedValue({
      ...processing,
      status: 'FAILED',
      error: { code: 'PROCESSING_FAILED', message: '처리에 실패했어요.' },
    });
    await submitForm();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('처리에 실패했어요.'));
    expect(replace).not.toHaveBeenCalled();
    expect(
      vi.mocked(track).mock.calls.filter(([event]) => event === EVENTS.DIARY_GENERATE_COMPLETE),
    ).toHaveLength(0);
    expect(screen.getByRole('button', { name: '여행 만들기' })).toBeInTheDocument();
  });

  it('취소할 수 없는 상태로 남은 여행은 삭제로 정리하고 새 여행을 만든다', async () => {
    const { deleteTrip } = await import('@/features/tripDetail/api/deleteTrip');
    vi.mocked(cancelTripProcessing).mockRejectedValueOnce(new Error('cannot cancel'));
    vi.mocked(createTrip)
      .mockResolvedValueOnce({ tripId: 7, status: 'PROCESSING' })
      .mockResolvedValueOnce({ tripId: 8, status: 'PROCESSING' });
    vi.mocked(uploadInitialAttachmentBatch)
      .mockRejectedValueOnce(new Error('invalid file'))
      .mockResolvedValueOnce({ ...completed, tripId: 8 });
    await submitForm();
    await waitFor(() => expect(uploadInitialAttachmentBatch).toHaveBeenCalledTimes(1));

    await userEvent.setup().click(await screen.findByRole('button', { name: '여행 만들기' }));

    await waitFor(() => expect(createTrip).toHaveBeenCalledTimes(2));
    expect(deleteTrip).toHaveBeenCalledWith(7, 'csrf');
  });
});
