import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteTrip } from '@/features/tripDetail/api/deleteTrip';
import { getTripPlaceFolders } from '@/features/tripDetail/api/getTripPlaceFolders';
import type { TripPlaceFolderPageResult } from '@/features/tripDetail/api/getTripPlaceFolders';
import type { TripDetail } from '@/features/tripDetail/model/types';

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
  hasStory: false,
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

function renderTripDetailPage(tripOverride: Partial<TripDetail> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TripDetailPage trip={{ ...trip, ...tripOverride }} />
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
    expect(screen.getByRole('button', { name: /스토리 보기/ })).toBeInTheDocument();
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

  it('링크 공유는 준비 중으로 표시하고 모달 진입을 막는다', async () => {
    const user = userEvent.setup();
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    const shareItem = screen.getByRole('menuitem', { name: /링크로 공유하기/ });

    expect(within(shareItem).getByText('준비 중')).toBeInTheDocument();
    expect(shareItem).toBeDisabled();
    await user.click(shareItem);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '공유할 이메일' })).not.toBeInTheDocument();
    expect(screen.queryByText(/공유할 사람/)).not.toBeInTheDocument();
  });

  it('키보드 메뉴 탐색에서도 준비 중인 링크 공유를 건너뛴다', async () => {
    const user = userEvent.setup();
    renderTripDetailPage();

    screen.getByRole('button', { name: '여행 더보기 메뉴' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /여행 수정/ })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: '여행 삭제' })).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

  it('hasStory가 true면 스토리 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderTripDetailPage({ hasStory: true });

    await user.click(screen.getByRole('button', { name: /스토리 보기/ }));

    expect(push).toHaveBeenCalledWith('/trips/7/story');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hasStory가 false면 생성 유도 모달을 띄우고 나중에 할게요로 닫는다', async () => {
    const user = userEvent.setup();
    renderTripDetailPage({ hasStory: false });

    await user.click(screen.getByRole('button', { name: /스토리 보기/ }));

    const dialog = screen.getByRole('dialog', { name: '아직 스토리가 없어요' });
    expect(dialog).toHaveTextContent('여행 스토리를 자동으로 만들어드릴게요.');
    expect(within(dialog).getByRole('button', { name: '스토리 만들기' })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: '나중에 할게요' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('스토리 만들기로 생성 화면에 진입한다', async () => {
    const user = userEvent.setup();
    renderTripDetailPage({ hasStory: false });
    await user.click(screen.getByRole('button', { name: /스토리 보기/ }));
    await user.click(screen.getByRole('button', { name: '스토리 만들기' }));
    expect(push).toHaveBeenCalledWith('/trips/7/story/create');
  });
});
