import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EVENTS, track } from '@/shared/lib/analytics';
import { toast } from '@/shared/ui/toast';

import { createTrip } from '../api/createTrip';
import {
  getTripProcessingStatus,
  type TripProcessingStatusResponse,
} from '../api/getTripProcessingStatus';
import { uploadInitialAttachmentBatch } from '../api/uploadInitialAttachments';
import { saveTripCreateDraft } from '../model/tripCreateDraft';
import type { TripCreateFormValues } from '../model/types';
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
vi.mock('../api/getTripProcessingStatus', () => ({ getTripProcessingStatus: vi.fn() }));
vi.mock('../api/uploadInitialAttachments', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/uploadInitialAttachments')>()),
  uploadInitialAttachmentBatch: vi.fn(),
}));
vi.mock('./tripImageStep', () => ({
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
vi.mock('./tripProcessingView', () => ({
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
});
