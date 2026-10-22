import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/shared/ui/toast';

import {
  getTripProcessingStatus,
  type TripProcessingStatusResponse,
} from '../api/getTripProcessingStatus';
import {
  addPendingTripProcessing,
  getPendingTripProcessingSnapshot,
} from '../model/pendingTripProcessing';
import { TripProcessingWatcher } from './tripProcessingWatcher';

const { pathname } = vi.hoisted(() => ({
  pathname: { current: '/' },
}));
vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));
vi.mock('@/shared/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/getTripProcessingStatus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/getTripProcessingStatus')>()),
  getTripProcessingStatus: vi.fn(),
}));

function status(
  tripId: number,
  value: TripProcessingStatusResponse['status'],
): TripProcessingStatusResponse {
  return { tripId, status: value, progress: null, currentStep: null, result: null, error: null };
}

let client: QueryClient;

function renderWatcher() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(client, 'invalidateQueries');
  return render(
    <QueryClientProvider client={client}>
      <TripProcessingWatcher />
    </QueryClientProvider>,
  );
}

describe('TripProcessingWatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    pathname.current = '/';
  });

  it('여행 만들기 화면을 나가도 사진 정리가 끝나면 토스트로 알리고 기록을 지운다', async () => {
    addPendingTripProcessing({ tripId: 7, kind: 'create' });
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status(7, 'COMPLETED'));
    renderWatcher();

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('여행을 만들었어요. 장소별로 사진을 정리했어요.'),
    );
    expect(getPendingTripProcessingSnapshot()).toBe('');
    expect(client.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['tripDetail'] });
  });

  it('FINALIZING은 진행 중으로 보고 알리지 않는다', async () => {
    addPendingTripProcessing({ tripId: 7, kind: 'create' });
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status(7, 'FINALIZING'));
    renderWatcher();

    await waitFor(() => expect(getTripProcessingStatus).toHaveBeenCalledWith(7));
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(getPendingTripProcessingSnapshot()).toMatch(/^create:7:\d+$/);
  });

  it('여행 수정에서 추가한 사진 정리가 실패하면 실패 토스트를 띄운다', async () => {
    addPendingTripProcessing({ tripId: 9, kind: 'edit' });
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status(9, 'FAILED'));
    renderWatcher();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        '추가한 사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.',
      ),
    );
    expect(getPendingTripProcessingSnapshot()).toBe('');
  });

  it('만들기 화면에 있으면 그 화면이 결과를 보여주므로 확인하지 않는다', async () => {
    pathname.current = '/trips/create';
    addPendingTripProcessing({ tripId: 7, kind: 'create' });
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status(7, 'COMPLETED'));
    renderWatcher();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getTripProcessingStatus).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('화면이 떠 있는 동안 새로 기록된 여행도 이어서 확인한다', async () => {
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status(11, 'COMPLETED'));
    renderWatcher();
    expect(getTripProcessingStatus).not.toHaveBeenCalled();

    act(() => addPendingTripProcessing({ tripId: 11, kind: 'create' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(getTripProcessingStatus).toHaveBeenCalledWith(11);
  });
  it('진행률 화면에 있으면 그 화면이 결과를 처리하므로 확인하지 않는다', async () => {
    addPendingTripProcessing({ tripId: 7, kind: 'create' });
    pathname.current = '/trips/7/processing';
    renderWatcher();

    await act(async () => {});
    expect(getTripProcessingStatus).not.toHaveBeenCalled();
  });

  it('같은 여행을 다시 수정해도 두 번째 수정의 완료를 알리고 확인을 멈춘다', async () => {
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status(9, 'COMPLETED'));
    renderWatcher();

    act(() => addPendingTripProcessing({ tripId: 9, kind: 'edit' }));
    await waitFor(() => expect(getPendingTripProcessingSnapshot()).toBe(''));
    expect(toast.success).toHaveBeenCalledTimes(1);

    // 두 번째 수정은 진행 중으로 시작해, 이전 완료 결과로 바로 끝났다고 보지 않아야 합니다.
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status(9, 'PROCESSING'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      addPendingTripProcessing({ tripId: 9, kind: 'edit' });
    });
    await waitFor(() => expect(getTripProcessingStatus).toHaveBeenCalledTimes(2));
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(getPendingTripProcessingSnapshot()).toMatch(/^edit:9:\d+$/);

    vi.mocked(getTripProcessingStatus).mockResolvedValue(status(9, 'COMPLETED'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(2), { timeout: 4_000 });
    expect(getPendingTripProcessingSnapshot()).toBe('');
  });
});
