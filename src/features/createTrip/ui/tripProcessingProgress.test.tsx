import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
import { TripProcessingProgress } from './tripProcessingProgress';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/shared/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/getTripProcessingStatus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/getTripProcessingStatus')>()),
  getTripProcessingStatus: vi.fn(),
}));

function status(
  value: TripProcessingStatusResponse['status'],
  progress: TripProcessingStatusResponse['progress'] = null,
): TripProcessingStatusResponse {
  return { tripId: 7, status: value, progress, currentStep: null, result: null, error: null };
}

function renderProgress() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TripProcessingProgress tripId={7} />
    </QueryClientProvider>,
  );
}

describe('TripProcessingProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('정리 중인 여행의 진행 단계를 보여주고, 다른 작업 이어하기로 목록에 돌아간다', async () => {
    vi.mocked(getTripProcessingStatus).mockResolvedValue(
      status('PROCESSING', { done: 5, total: 10 }),
    );
    renderProgress();

    expect(
      await screen.findByRole('status', { name: '사진 5/10장을 살펴봤어요' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '다른 작업 이어하기' }));
    expect(replace).toHaveBeenCalledWith('/trips');
  });

  it('정리가 끝나면 알리고 대기 기록을 지운 뒤 여행 상세로 이동한다', async () => {
    addPendingTripProcessing({ tripId: 7, kind: 'create' });
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status('COMPLETED'));
    renderProgress();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips/7'));
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(getPendingTripProcessingSnapshot()).toBe('');
  });

  it('정리에 실패하면 알리고 목록으로 돌아간다', async () => {
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status('FAILED'));
    renderProgress();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips'));
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('수정 작업이면 여행 수정 제목을 보여주고, 완료 시 사진 추가 완료로 알린다', async () => {
    addPendingTripProcessing({ tripId: 7, kind: 'edit' });
    vi.mocked(getTripProcessingStatus).mockResolvedValueOnce(status('PROCESSING'));
    renderProgress();

    expect(await screen.findByRole('heading', { name: '여행 수정' })).toBeInTheDocument();

    vi.mocked(getTripProcessingStatus).mockResolvedValue(status('COMPLETED'));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips/7'), { timeout: 4_000 });
    expect(toast.success).toHaveBeenCalledWith('추가한 사진을 장소별로 정리했어요.');
  });

  it('이 브라우저에 기록이 없으면 여행 만들기 제목을 쓴다', async () => {
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status('PROCESSING'));
    renderProgress();

    expect(await screen.findByRole('heading', { name: '여행 만들기' })).toBeInTheDocument();
  });
});
