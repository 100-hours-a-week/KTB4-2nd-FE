import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTripSummary } from '@/features/tripDetail/api/fetchTripSummary';

import { toast } from '@/shared/ui/toast';

import { cancelTripProcessing } from '../api/cancelTripProcessing';
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
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('../api/cancelTripProcessing', () => ({ cancelTripProcessing: vi.fn() }));
vi.mock('@/features/tripDetail/api/fetchTripSummary', () => ({ fetchTripSummary: vi.fn() }));

function apiError(status: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('failed', undefined, config, null, {
    status,
    statusText: '',
    data: null,
    headers: {},
    config,
  });
}
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
    vi.mocked(cancelTripProcessing).mockResolvedValue(undefined);
  });

  it('여행 만들기에 다시 들어오면 생성을 취소하고 여행 목록으로 돌아갈 수 있다', async () => {
    addPendingTripProcessing({ tripId: 7, kind: 'create' });
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status('PROCESSING'));
    const user = userEvent.setup();
    renderProgress();

    await user.click(await screen.findByRole('button', { name: '여행 생성 취소하기' }));
    const dialog = screen.getByRole('dialog', { name: '아직 폴더를 생성 중입니다.' });
    expect(dialog).toHaveTextContent('올린 사진은 저장되지 않고 여행 목록으로 돌아가요.');
    await user.click(within(dialog).getByRole('button', { name: '취소하기' }));

    await waitFor(() => expect(cancelTripProcessing).toHaveBeenCalledWith(7, 'csrf-token'));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips'));
    expect(toast.success).toHaveBeenCalledWith('여행 생성을 취소했어요.');
    expect(getPendingTripProcessingSnapshot()).toBe('');
  });

  it('취소하지 못하면 알리고 진행 화면에 남는다', async () => {
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status('PROCESSING'));
    vi.mocked(cancelTripProcessing).mockRejectedValue(new Error('failed'));
    const user = userEvent.setup();
    renderProgress();

    await user.click(await screen.findByRole('button', { name: '여행 생성 취소하기' }));
    await user.click(screen.getByRole('button', { name: '취소하기' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        '여행 생성을 취소하지 못했어요. 잠시 후 다시 시도해주세요.',
      ),
    );
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '여행 생성 취소하기' })).toBeEnabled();
  });

  it('사진 추가(여행 수정) 정리 중이면 생성 취소 버튼을 보여주지 않는다', async () => {
    addPendingTripProcessing({ tripId: 7, kind: 'edit' });
    vi.mocked(getTripProcessingStatus).mockResolvedValue(status('PROCESSING'));
    renderProgress();

    expect(await screen.findByRole('heading', { name: '여행 수정' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '여행 생성 취소하기' })).not.toBeInTheDocument();
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

  describe('공유받은 여행을 아직 정리 중일 때', () => {
    it('진행 상태가 404여도 목록으로 보내지 않고 기다리는 화면을 보여주며, 취소 버튼은 없다', async () => {
      vi.mocked(getTripProcessingStatus).mockRejectedValue(apiError(404));
      vi.mocked(fetchTripSummary).mockRejectedValue(apiError(409));
      renderProgress();

      expect(
        await screen.findByRole('heading', { name: '공유받은 여행을 정리하고 있어요' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '여행 생성 취소하기' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: '초대받은 폴더로 가기' })).toHaveAttribute(
        'href',
        '/mypage/invited',
      );
      expect(replace).not.toHaveBeenCalled();
    });

    it('정리가 끝나 여행이 열리면 바로 여행 상세로 들어간다', async () => {
      const user = userEvent.setup();
      vi.mocked(getTripProcessingStatus).mockRejectedValue(apiError(404));
      vi.mocked(fetchTripSummary).mockRejectedValueOnce(apiError(409));
      renderProgress();
      await screen.findByRole('heading', { name: '공유받은 여행을 정리하고 있어요' });

      vi.mocked(fetchTripSummary).mockResolvedValue({} as never);
      await user.click(screen.getByRole('button', { name: '지금 다시 확인하기' }));

      await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips/7'));
    });

    it('이 브라우저에서 시작한 작업이 404면 지금처럼 목록으로 돌아간다', async () => {
      addPendingTripProcessing({ tripId: 7, kind: 'create' });
      vi.mocked(getTripProcessingStatus).mockRejectedValue(apiError(404));
      renderProgress();

      await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips'));
      expect(screen.queryByText('공유받은 여행을 정리하고 있어요')).not.toBeInTheDocument();
    });
  });
});
