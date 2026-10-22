import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deletePhoto } from '@/features/photoList/api/photoDelete';
import { toast } from '@/shared/ui/toast';

import { getTripForEdit, type TripEditData } from '../api/getTripForEdit';
import { getTripProcessingStatus } from '../api/getTripProcessingStatus';
import { updateTrip } from '../api/updateTrip';
import { uploadAdditionalAttachmentBatch } from '../api/uploadAdditionalAttachments';
import type { TripCreateStep } from '../model/types';
import { TripEditForm } from './tripEditForm';

const { replace, back, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace, back, refresh }),
}));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('@/shared/ui/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));
vi.mock('../api/getTripForEdit', () => ({ getTripForEdit: vi.fn() }));
vi.mock('../api/updateTrip', () => ({ updateTrip: vi.fn() }));
vi.mock('../api/uploadAdditionalAttachments', () => ({
  uploadAdditionalAttachmentBatch: vi.fn(),
}));
vi.mock('../api/getTripProcessingStatus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/getTripProcessingStatus')>()),
  getTripProcessingStatus: vi.fn(),
}));
vi.mock('../api/searchPlaces', () => ({ searchPlaces: vi.fn() }));
vi.mock('@/features/photoList/api/photoDelete', () => ({
  deletePhoto: vi.fn(),
  deletePhotos: vi.fn(),
}));

const trip: TripEditData = {
  tripId: 7,
  tripName: '제주 여행',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
  places: [{ regionCode: '50110', regionName: '제주시' }],
  photoCount: 2,
  photos: [
    { id: 101, thumbnailUrl: null },
    { id: 102, thumbnailUrl: null },
  ],
};

function renderForm(initialStep: TripCreateStep) {
  window.history.replaceState(null, '', `/trips/7/edit?step=${initialStep}`);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TripEditForm tripId={7} initialStep={initialStep} />
    </QueryClientProvider>,
  );
}

function conflict(code: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('conflict', undefined, config, null, {
    status: 409,
    statusText: '',
    data: { message: code, data: null },
    headers: {},
    config,
  });
}

describe('TripEditForm', () => {
  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTripForEdit).mockResolvedValue(trip);
    vi.mocked(updateTrip).mockResolvedValue(undefined);
    vi.mocked(deletePhoto).mockResolvedValue(undefined);
    vi.mocked(uploadAdditionalAttachmentBatch).mockResolvedValue(undefined);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });
  afterEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL,
    });
  });

  it('기존 값을 채워 보여주고 이름만 바꾸면 이름만 수정 요청한다', async () => {
    const user = userEvent.setup();
    renderForm('name');

    const nameInput = await screen.findByDisplayValue('제주 여행');
    expect(screen.getByRole('heading', { name: '여행 수정' })).toBeInTheDocument();
    await user.clear(nameInput);
    await user.type(nameInput, '부산 여행');
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(await screen.findByRole('button', { name: '다음' }));
    await user.click(await screen.findByRole('button', { name: '다음' }));
    await user.click(await screen.findByRole('button', { name: '수정 완료' }));

    await waitFor(() =>
      expect(updateTrip).toHaveBeenCalledWith(7, { tripName: '부산 여행' }, 'csrf-token'),
    );
    expect(deletePhoto).not.toHaveBeenCalled();
    expect(uploadAdditionalAttachmentBatch).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('여행을 수정했어요.');
    expect(replace).toHaveBeenCalledWith('/trips/7');
  });

  it('바뀐 내용이 없으면 저장하지 않는다', async () => {
    const user = userEvent.setup();
    renderForm('images');

    await user.click(await screen.findByRole('button', { name: '수정 완료' }));

    expect(toast.info).toHaveBeenCalledWith('바뀐 내용이 없어요.');
    expect(updateTrip).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('기존 사진을 눌러 삭제 예정으로 표시하고 다시 눌러 취소할 수 있다', async () => {
    const user = userEvent.setup();
    renderForm('images');

    const first = await screen.findByRole('button', { name: '1번째 기존 사진 삭제' });
    await user.click(first);
    expect(screen.getByRole('button', { name: '1번째 기존 사진 삭제 취소' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('1장 삭제 예정')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1번째 기존 사진 삭제 취소' }));
    await user.click(screen.getByRole('button', { name: '2번째 기존 사진 삭제' }));
    await user.click(screen.getByRole('button', { name: '수정 완료' }));

    await waitFor(() => expect(deletePhoto).toHaveBeenCalledWith(102, 'csrf-token'));
    expect(updateTrip).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/trips/7');
  });

  it('사진을 모두 지우면 저장하지 않고 한 장 이상 남기도록 안내한다', async () => {
    const user = userEvent.setup();
    renderForm('images');

    await user.click(await screen.findByRole('button', { name: '1번째 기존 사진 삭제' }));
    await user.click(screen.getByRole('button', { name: '2번째 기존 사진 삭제' }));
    await user.click(screen.getByRole('button', { name: '수정 완료' }));

    expect(toast.error).toHaveBeenCalledWith('사진을 한 장 이상 남겨주세요.');
    expect(deletePhoto).not.toHaveBeenCalled();
  });

  it('새 사진은 추가 업로드한 뒤 장소 정리가 끝나면 상세로 돌아간다', async () => {
    vi.mocked(getTripProcessingStatus).mockResolvedValue({
      tripId: 7,
      status: 'COMPLETED',
      progress: null,
      currentStep: null,
      result: null,
      error: null,
    });
    const user = userEvent.setup();
    const { container } = renderForm('images');

    await screen.findByRole('button', { name: '수정 완료' });
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    await user.upload(input!, new File(['photo'], 'new.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: '수정 완료' }));

    await waitFor(() =>
      expect(uploadAdditionalAttachmentBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: 7,
          additionId: expect.stringMatching(/^[0-9a-f-]{36}$/),
          batchNo: 1,
          totalAttachmentCount: 1,
          complete: true,
          csrfToken: 'csrf-token',
        }),
      ),
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips/7'));
    expect(getTripProcessingStatus).toHaveBeenCalledWith(7);
    expect(toast.success).toHaveBeenCalledWith('여행을 수정했어요.');
  });

  it('사진 정리 중 다른 작업 이어하기를 누르면 409로 막히는 상세 대신 목록으로 나간다', async () => {
    vi.mocked(getTripProcessingStatus).mockResolvedValue({
      tripId: 7,
      status: 'PROCESSING',
      progress: null,
      currentStep: null,
      result: null,
      error: null,
    });
    const user = userEvent.setup();
    const { container } = renderForm('images');

    await screen.findByRole('button', { name: '수정 완료' });
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    await user.upload(input!, new File(['photo'], 'new.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: '수정 완료' }));

    expect(await screen.findByRole('heading', { name: '여행 수정' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: '다른 작업 이어하기' }));

    expect(replace).toHaveBeenCalledWith('/trips');
    expect(replace).not.toHaveBeenCalledWith('/trips/7');
  });

  it('같은 이름의 여행이 있으면 이름 단계로 돌아가 안내한다', async () => {
    vi.mocked(updateTrip).mockRejectedValue(conflict('TRIP_NAME_DUPLICATED'));
    const user = userEvent.setup();
    renderForm('name');

    const nameInput = await screen.findByDisplayValue('제주 여행');
    await user.clear(nameInput);
    await user.type(nameInput, '부산 여행');
    await user.click(screen.getByRole('button', { name: '다음' }));
    await user.click(await screen.findByRole('button', { name: '다음' }));
    await user.click(await screen.findByRole('button', { name: '다음' }));
    await user.click(await screen.findByRole('button', { name: '수정 완료' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('같은 이름의 여행이 이미 있어요.'),
    );
    expect(await screen.findByDisplayValue('부산 여행')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
