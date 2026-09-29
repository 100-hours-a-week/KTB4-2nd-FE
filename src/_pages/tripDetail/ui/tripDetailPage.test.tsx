import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteTrip } from '@/features/tripDetail/api/deleteTrip';
import { getTripPlaceFolders } from '@/features/tripDetail/api/getTripPlaceFolders';
import type { TripPlaceFolderPageResult } from '@/features/tripDetail/api/getTripPlaceFolders';
import type { TripDetail } from '@/features/tripDetail/model/types';
import { toast } from '@/shared/ui/toast';

import { TripDetailPage } from './tripDetailPage';

const replace = vi.fn();
const push = vi.fn();
const back = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push, back }) }));
vi.mock('@/features/tripDetail/api/deleteTrip', () => ({ deleteTrip: vi.fn() }));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('@/features/tripDetail/api/getTripPlaceFolders', () => ({
  getTripPlaceFolders: vi.fn(),
}));

const trip: TripDetail = {
  id: 7,
  name: '제주도 가을 여행',
  locations: ['서귀포시', '제주시', '우도'],
  startDate: '2025-10-12',
  endDate: '2025-10-14',
  nights: 2,
  photoCount: 128,
  reviewCount: 0,
};

const folders: TripPlaceFolderPageResult = {
  folders: [
    { id: 1, name: '서귀포', photoCount: 35, thumbnailUrl: null, accent: 'coast' },
    { id: 2, name: '성산일출봉', photoCount: 15, thumbnailUrl: null, accent: 'sunset' },
  ],
  hasNext: false,
  nextCursor: null,
};

function axiosErrorWithStatus(status: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('failed', undefined, config, null, {
    status,
    statusText: '',
    data: null,
    headers: {},
    config,
  });
}

function renderTripDetailPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TripDetailPage trip={trip} />
    </QueryClientProvider>,
  );
}

describe('TripDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTripPlaceFolders).mockResolvedValue(folders);
    vi.mocked(deleteTrip).mockResolvedValue(undefined);
  });

  it('여행 정보와 장소 폴더 API 결과를 표시한다', async () => {
    renderTripDetailPage();

    expect(screen.getByRole('heading', { level: 1, name: '제주도 가을 여행' })).toBeInTheDocument();
    expect(screen.getByText('서귀포시 외 2개')).toBeInTheDocument();
    expect(screen.getByText('사진 128장')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /서귀포 사진 35장 보기/ })).toHaveAttribute(
      'href',
      '/trips/7/places/1/photos?place=%EC%84%9C%EA%B7%80%ED%8F%AC&trip=%EC%A0%9C%EC%A3%BC%EB%8F%84%20%EA%B0%80%EC%9D%84%20%EC%97%AC%ED%96%89',
    );
    expect(screen.getByRole('link', { name: /성산일출봉 사진 15장 보기/ })).toBeInTheDocument();
    expect(getTripPlaceFolders).toHaveBeenCalledWith(7, null);
  });

  it('헤더의 뒤로가기를 누르면 실제 이전 페이지로 돌아간다', async () => {
    const user = userEvent.setup();
    const historyLength = vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '이전 페이지로 돌아가기' }));

    expect(back).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
    historyLength.mockRestore();
  });

  it('이전 방문 기록이 없으면 여행 목록으로 이동한다', async () => {
    const user = userEvent.setup();
    const historyLength = vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '이전 페이지로 돌아가기' }));

    expect(back).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/trips');
    historyLength.mockRestore();
  });

  it('다음 커서가 있으면 장소 폴더를 이어서 모두 불러온다', async () => {
    vi.mocked(getTripPlaceFolders)
      .mockResolvedValueOnce({ ...folders, hasNext: true, nextCursor: 'cursor-2' })
      .mockResolvedValueOnce({
        folders: [{ id: 3, name: '우도', photoCount: 28, thumbnailUrl: null, accent: 'island' }],
        hasNext: false,
        nextCursor: null,
      });

    renderTripDetailPage();

    expect(await screen.findByRole('link', { name: /우도/ })).toBeInTheDocument();
    expect(getTripPlaceFolders).toHaveBeenLastCalledWith(7, 'cursor-2');
  });

  it('장소 폴더 조회에 실패하면 다시 시도로 재요청한다', async () => {
    vi.mocked(getTripPlaceFolders).mockRejectedValue(new Error('failed'));
    renderTripDetailPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('사진 로드에 실패했어요.');

    vi.mocked(getTripPlaceFolders).mockResolvedValue(folders);
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('link', { name: /서귀포/ })).toBeInTheDocument();
  });

  it('공유 이메일 추가는 아직 지원하지 않는다고 알린다', async () => {
    const warning = vi.spyOn(toast, 'warning');
    const user = userEvent.setup();
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '링크로 공유하기' }));

    expect(
      screen.getByRole('dialog', { name: '공유할 이메일을 입력해주세요' }),
    ).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: '공유할 이메일' }), 'new@example.com');
    await user.click(screen.getByRole('button', { name: '추가하기' }));

    expect(warning).toHaveBeenCalledWith('아직 지원하지 않는 기능이에요.');
    expect(screen.queryByText('new@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('공유할 사람 3')).toBeInTheDocument();
  });

  it('더보기 메뉴에서 여행 삭제를 누르면 확인 창을 표시한다', async () => {
    const user = userEvent.setup();
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '여행 삭제' }));

    expect(screen.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })).toBeInTheDocument();
    expect(screen.getByText(/사진 128장이 삭제되며/)).toBeInTheDocument();
  });

  it('삭제를 확정하면 CSRF 토큰과 함께 삭제 API를 부르고 목록으로 보낸다', async () => {
    const user = userEvent.setup();
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '여행 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    await waitFor(() => expect(deleteTrip).toHaveBeenCalledWith(7, 'csrf-token'));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips'));
  });

  it('정리 중인 여행이면 삭제하지 않고 다이얼로그를 닫는다', async () => {
    vi.mocked(deleteTrip).mockRejectedValue(axiosErrorWithStatus(409));
    const user = userEvent.setup();
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '여행 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(replace).not.toHaveBeenCalled();
  });

  it('이미 삭제된 여행이면 목록으로 보낸다', async () => {
    vi.mocked(deleteTrip).mockRejectedValue(axiosErrorWithStatus(404));
    const user = userEvent.setup();
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '여행 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/trips'));
  });
});
