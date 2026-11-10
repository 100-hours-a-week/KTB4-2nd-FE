import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deletePhoto } from '@/features/photoList/api/photoDelete';
import { TripRealtimeSync } from '@/features/realtimeSync';
import { fetchTripSummary } from '@/features/tripDetail/api/fetchTripSummary';
import { TripPresenceProvider } from '@/features/tripPresence';
import type { RealtimeSubscription } from '@/shared/api/realtime';
import { toast } from '@/shared/ui/toast';

import { getTripForEdit, type TripEditData } from '../api/getTripForEdit';
import { getTripProcessingStatus } from '../api/getTripProcessingStatus';
import { updateTrip } from '../api/updateTrip';
import { uploadAdditionalAttachmentBatch } from '../api/uploadAdditionalAttachments';
import type { TripCreateStep } from '../model/types';
import { TripEditForm } from './tripEditForm';

const { replace, back, realtime } = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
  realtime: {
    connected: false,
    subscriptions: [] as RealtimeSubscription[],
    publish: vi.fn(),
  },
}));
vi.mock('@/shared/api/realtime', () => ({
  isRealtimeConnected: () => realtime.connected,
  realtimePollingInterval: (ms: number) => ms,
  subscribeRealtimeStatus: () => () => {},
  publishRealtime: (destination: string, body?: unknown) => {
    realtime.publish(destination, body);
    return realtime.connected;
  },
  subscribeRealtime: (subscription: RealtimeSubscription) => {
    realtime.subscriptions.push(subscription);
    if (realtime.connected) subscription.onSubscribed?.();
    return () => {
      realtime.subscriptions = realtime.subscriptions.filter((item) => item !== subscription);
    };
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace, back }),
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
vi.mock('@/features/tripDetail/api/fetchTripSummary', () => ({ fetchTripSummary: vi.fn() }));
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
  // 실제 화면처럼 여행 레이아웃의 접속자 목록과 실시간 동기화 안에 그립니다.
  return render(
    <QueryClientProvider client={client}>
      <TripPresenceProvider tripId={7} currentUserId={1}>
        <TripRealtimeSync tripId={7} />
        <TripEditForm tripId={7} initialStep={initialStep} />
      </TripPresenceProvider>
    </QueryClientProvider>,
  );
}

async function waitForTripEvents() {
  await waitFor(() =>
    expect(
      realtime.subscriptions.some(({ destination }) => destination === '/topic/trips/7/events'),
    ).toBe(true),
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

function emit(destination: string, body: unknown) {
  act(() => {
    realtime.subscriptions
      .filter((subscription) => subscription.destination === destination)
      .forEach((subscription) => subscription.onMessage(body));
  });
}

function presence(members: { userId: number; nickname: string; permission: string }[]) {
  return {
    message: 'PRESENCE_SNAPSHOT',
    data: {
      tripId: 7,
      epoch: 'epoch-1',
      revision: members.length,
      members: members.map((member) => ({ ...member, profileImageUrl: null })),
    },
  };
}

describe('TripEditForm', () => {
  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    realtime.connected = false;
    realtime.subscriptions = [];
    vi.mocked(getTripForEdit).mockResolvedValue(trip);
    vi.mocked(fetchTripSummary).mockResolvedValue({} as never);
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

  it('기존 사진 삭제는 성공하고 새 사진 업로드가 실패하면, 지워진 사진을 목록에서 빼고 다시 지우지 않는다', async () => {
    vi.mocked(uploadAdditionalAttachmentBatch).mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    const { container } = renderForm('images');

    await user.click(await screen.findByRole('button', { name: '1번째 기존 사진 삭제' }));
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    await user.upload(input!, new File(['photo'], 'new.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: '수정 완료' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(deletePhoto).toHaveBeenCalledWith(101, 'csrf-token');
    expect(await screen.findByRole('button', { name: '1번째 기존 사진 삭제' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /삭제 취소/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /번째 기존 사진/ })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '수정 완료' }));
    await waitFor(() => expect(uploadAdditionalAttachmentBatch).toHaveBeenCalledTimes(2));
    expect(deletePhoto).toHaveBeenCalledTimes(1);
  });

  it('삭제 표시한 기존 사진을 되살려 200장을 넘게 되면 막는다', async () => {
    vi.mocked(getTripForEdit).mockResolvedValue({
      ...trip,
      photoCount: 200,
      photos: Array.from({ length: 200 }, (_, index) => ({ id: index + 1, thumbnailUrl: null })),
    });
    const user = userEvent.setup();
    const { container } = renderForm('images');

    await user.click(await screen.findByRole('button', { name: '1번째 기존 사진 삭제' }));
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    await user.upload(input!, new File(['photo'], 'new.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: '1번째 기존 사진 삭제 취소' }));

    expect(toast.error).toHaveBeenCalledWith('여행 하나에 사진은 최대 200장까지 올릴 수 있어요.');
    expect(screen.getByRole('button', { name: '1번째 기존 사진 삭제 취소' })).toBeInTheDocument();
  });

  describe('함께 편집', () => {
    beforeEach(() => {
      realtime.connected = true;
    });

    it('접속자 목록에 참여하고, 다른 사람이 있으면 헤더 아래에 보여주며 누르면 참여자 시트를 연다', async () => {
      const user = userEvent.setup();
      renderForm('name');
      await screen.findByDisplayValue('제주 여행');

      expect(realtime.publish).toHaveBeenCalledWith('/app/trips/7/presence/join', undefined);
      emit(
        '/topic/trips/7/presence',
        presence([{ userId: 1, nickname: '혜준', permission: 'OWNER' }]),
      );
      expect(screen.queryByText(/함께 보는 중/)).not.toBeInTheDocument();

      emit(
        '/topic/trips/7/presence',
        presence([
          { userId: 1, nickname: '혜준', permission: 'OWNER' },
          { userId: 2, nickname: '지민', permission: 'WRITE' },
        ]),
      );
      await user.click(screen.getByRole('button', { name: '지민님과 함께 보는 중' }));

      const sheet = screen.getByRole('dialog', { name: '함께 보는 중 2명' });
      expect(sheet).toHaveTextContent('혜준 (나)');
      expect(sheet).toHaveTextContent('편집할 수 있어요');
    });

    it('연결되어 있으면 웹소켓 명령으로 저장하고 결과를 받으면 상세로 돌아간다', async () => {
      const user = userEvent.setup();
      renderForm('name');
      await waitForTripEvents();

      const nameInput = await screen.findByDisplayValue('제주 여행');
      await user.clear(nameInput);
      await user.type(nameInput, '부산 여행');
      await user.click(screen.getByRole('button', { name: '다음' }));
      await user.click(await screen.findByRole('button', { name: '다음' }));
      await user.click(await screen.findByRole('button', { name: '다음' }));
      await user.click(await screen.findByRole('button', { name: '수정 완료' }));

      await waitFor(() =>
        expect(realtime.publish).toHaveBeenCalledWith('/app/trips/7/update', {
          requestId: expect.any(String),
          changes: { tripName: '부산 여행' },
        }),
      );
      const [, { requestId }] = realtime.publish.mock.calls.find(
        ([destination]) => destination === '/app/trips/7/update',
      )!;
      emit('/user/queue/command-results', {
        message: 'TRIP_UPDATE_SUCCESS',
        data: { requestId, tripId: 7, status: 'SUCCEEDED', sequence: 3 },
      });

      await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips/7'));
      expect(updateTrip).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('여행을 수정했어요.');

      emit('/topic/trips/7/events', {
        message: 'TRIP_UPDATED',
        data: {
          eventId: 'e-own',
          requestId,
          tripId: 7,
          sequence: 3,
          changes: { tripName: '부산 여행' },
        },
      });
      expect(toast.info).not.toHaveBeenCalled();
    });

    it('명령이 거절되면 이유를 안내한다', async () => {
      const user = userEvent.setup();
      renderForm('images');

      await user.click(await screen.findByRole('button', { name: '1번째 기존 사진 삭제' }));
      await user.click(screen.getByRole('button', { name: '수정 완료' }));
      await waitFor(() =>
        expect(realtime.publish).toHaveBeenCalledWith('/app/trips/7/attachments/delete', {
          requestId: expect.any(String),
          attachmentIds: [101],
        }),
      );
      const [, { requestId }] = realtime.publish.mock.calls.find(
        ([destination]) => destination === '/app/trips/7/attachments/delete',
      )!;
      emit('/user/queue/command-results', {
        message: 'WRITE_PERMISSION_REQUIRED',
        data: { requestId, tripId: 7, status: 'REJECTED' },
      });

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('이 여행을 편집할 권한이 없어요.'),
      );
      expect(deletePhoto).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });

    it('다른 곳에서 이름이 바뀌면 알리고, 내가 고치지 않은 이름 칸을 새 값으로 바꾼다', async () => {
      renderForm('name');
      await screen.findByDisplayValue('제주 여행');
      await waitForTripEvents();

      vi.mocked(getTripForEdit).mockResolvedValue({ ...trip, tripName: '제주 가을 여행' });
      emit('/topic/trips/7/events', {
        message: 'TRIP_UPDATED',
        data: {
          eventId: 'e1',
          requestId: 'other',
          tripId: 7,
          sequence: 4,
          changes: { tripName: '제주 가을 여행' },
        },
      });

      expect(toast.info).toHaveBeenCalledWith('여행 이름이 바뀌었어요.');
      expect(await screen.findByDisplayValue('제주 가을 여행')).toBeInTheDocument();
    });

    it('내가 고치던 이름은 다른 곳에서 바뀌어도 그대로 둔다', async () => {
      const user = userEvent.setup();
      renderForm('name');
      const nameInput = await screen.findByDisplayValue('제주 여행');
      await user.clear(nameInput);
      await user.type(nameInput, '부산 여행');
      await waitForTripEvents();

      vi.mocked(getTripForEdit).mockResolvedValue({ ...trip, tripName: '제주 가을 여행' });
      emit('/topic/trips/7/events', {
        message: 'TRIP_UPDATED',
        data: {
          eventId: 'e2',
          requestId: 'other',
          tripId: 7,
          sequence: 5,
          changes: { tripName: '제주 가을 여행' },
        },
      });

      await waitFor(() => expect(getTripForEdit).toHaveBeenCalledTimes(2));
      expect(screen.getByDisplayValue('부산 여행')).toBeInTheDocument();
    });
  });
});
