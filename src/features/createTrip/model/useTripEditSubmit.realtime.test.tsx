import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deletePhoto, deletePhotos } from '@/features/photoList';
import { isRealtimeConnected, waitForRealtimeConnection } from '@/shared/api/realtime';

import type { TripEditData } from '../api/getTripForEdit';
import { sendTripEditCommand, TripEditCommandError } from '../api/sendTripEditCommand';
import { updateTrip } from '../api/updateTrip';
import type { TripCreateFormValues } from './types';
import { useTripEditSubmit } from './useTripEditSubmit';

vi.mock('@/shared/api/browser', () => ({ fetchCsrfToken: vi.fn().mockResolvedValue('csrf') }));
vi.mock('@/shared/api/realtime', () => ({
  isRealtimeConnected: vi.fn(),
  waitForRealtimeConnection: vi.fn(),
  realtimePollingInterval: (ms: number) => ms,
}));
vi.mock('@/features/photoList', () => ({ deletePhoto: vi.fn(), deletePhotos: vi.fn() }));
vi.mock('../api/updateTrip', () => ({ updateTrip: vi.fn() }));
vi.mock('../api/sendTripEditCommand', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/sendTripEditCommand')>()),
  sendTripEditCommand: vi.fn(),
}));

const initial: TripEditData = {
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

const renamed: TripCreateFormValues = {
  tripName: '부산 여행',
  places: initial.places,
  startDate: initial.startDate,
  endDate: initial.endDate,
  attachments: [],
};

function renderSubmit(realtimeOnly: boolean) {
  const onFinished = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useTripEditSubmit(initial, onFinished, { realtimeOnly }), {
    wrapper,
  });
  return { result, onFinished };
}

describe('useTripEditSubmit 저장 경로', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isRealtimeConnected).mockReturnValue(false);
    vi.mocked(sendTripEditCommand).mockResolvedValue();
  });

  it('공유받은 사람은 웹소켓이 끊겨 있으면 다시 연결되기를 기다렸다가 웹소켓으로 저장한다', async () => {
    vi.mocked(waitForRealtimeConnection).mockResolvedValue(true);
    const { result, onFinished } = renderSubmit(true);

    act(() => result.current.submit({ values: renamed, removedPhotoIds: [101] }));

    await waitFor(() => expect(onFinished).toHaveBeenCalledWith(null));
    expect(sendTripEditCommand).toHaveBeenCalledWith(7, expect.any(String), {
      type: 'update',
      changes: { tripName: '부산 여행' },
    });
    expect(sendTripEditCommand).toHaveBeenCalledWith(7, expect.any(String), {
      type: 'attachments/delete',
      attachmentIds: [101],
    });
    expect(updateTrip).not.toHaveBeenCalled();
    expect(deletePhoto).not.toHaveBeenCalled();
    expect(deletePhotos).not.toHaveBeenCalled();
  });

  it('공유받은 사람은 다시 연결되지 않으면 REST로 보내지 않고 연결 오류로 끝낸다', async () => {
    vi.mocked(waitForRealtimeConnection).mockResolvedValue(false);
    const onError = vi.fn();
    const { result, onFinished } = renderSubmit(true);

    act(() => result.current.submit({ values: renamed, removedPhotoIds: [101, 102] }, { onError }));

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError.mock.calls[0][0]).toEqual(new TripEditCommandError('REALTIME_DISCONNECTED'));
    expect(sendTripEditCommand).not.toHaveBeenCalled();
    expect(updateTrip).not.toHaveBeenCalled();
    expect(deletePhotos).not.toHaveBeenCalled();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('여행 주인은 웹소켓이 끊겨 있으면 기다리지 않고 REST로 저장한다', async () => {
    const { result, onFinished } = renderSubmit(false);

    act(() => result.current.submit({ values: renamed, removedPhotoIds: [101, 102] }));

    await waitFor(() => expect(onFinished).toHaveBeenCalledWith(null));
    expect(updateTrip).toHaveBeenCalledWith(7, { tripName: '부산 여행' }, 'csrf');
    expect(deletePhotos).toHaveBeenCalledWith([101, 102], 'csrf');
    expect(waitForRealtimeConnection).not.toHaveBeenCalled();
    expect(sendTripEditCommand).not.toHaveBeenCalled();
  });
});
