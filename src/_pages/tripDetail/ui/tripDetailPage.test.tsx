import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteTrip } from '@/features/tripDetail/api/deleteTrip';
import { fetchTripSummary } from '@/features/tripDetail/api/fetchTripSummary';
import { getTripPlaceFolders } from '@/features/tripDetail/api/getTripPlaceFolders';
import { getUnclassifiedFolders } from '@/features/unclassifiedPhotos/api/getUnclassifiedFolders';
import type { TripPlaceFolderPageResult } from '@/features/tripDetail/api/getTripPlaceFolders';
import type { TripDetail } from '@/features/tripDetail/model/types';

import { TripDetailPage } from './tripDetailPage';

const replace = vi.fn();
const push = vi.fn();
const back = vi.fn();
let searchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push, back }),
  usePathname: () => '/trips/7',
  useSearchParams: () => searchParams,
}));
vi.mock('@/features/tripDetail/ui/tripPlaceMap', () => ({
  TripPlaceMap: ({ tripId }: { tripId: number }) => <div>여행 {tripId} 지도</div>,
}));
vi.mock('@/features/tripDetail/api/deleteTrip', () => ({ deleteTrip: vi.fn() }));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('@/features/tripDetail/api/fetchTripSummary', () => ({ fetchTripSummary: vi.fn() }));
vi.mock('@/features/unclassifiedPhotos/api/getUnclassifiedFolders', () => ({
  getUnclassifiedFolders: vi.fn(),
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

function renderTripDetailPage(
  tripOverride: Partial<TripDetail> = {},
  latestOverride: Partial<TripDetail> = {},
) {
  vi.mocked(fetchTripSummary).mockResolvedValue({ ...trip, ...tripOverride, ...latestOverride });
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
    searchParams = new URLSearchParams();
    vi.mocked(getTripPlaceFolders).mockResolvedValue(folders);
    vi.mocked(deleteTrip).mockResolvedValue(undefined);
    vi.mocked(getUnclassifiedFolders).mockResolvedValue([]);
  });

  it('여행 정보와 장소 폴더 API 결과를 표시한다', async () => {
    renderTripDetailPage();

    expect(screen.getByRole('heading', { level: 1, name: '제주도 가을 여행' })).toBeInTheDocument();
    expect(screen.getByText('서귀포시 외 2개')).toBeInTheDocument();
    expect(screen.getByText('정리된 사진 128장')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /스토리 보기/ })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /서귀포 사진 35장 보기/ })).toHaveAttribute(
      'href',
      '/trips/7/places/1/photos?place=%EC%84%9C%EA%B7%80%ED%8F%AC&trip=%EC%A0%9C%EC%A3%BC%EB%8F%84%20%EA%B0%80%EC%9D%84%20%EC%97%AC%ED%96%89',
    );
    expect(screen.getByRole('link', { name: /성산일출봉 사진 15장 보기/ })).toBeInTheDocument();
    expect(getTripPlaceFolders).toHaveBeenCalledWith(7, null);
  });

  it('지도로 보기를 누르면 URL에 지도 보기 상태를 남긴다', async () => {
    const user = userEvent.setup();
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '지도로 보기' }));

    expect(replace).toHaveBeenCalledWith('/trips/7?view=map', { scroll: false });
  });

  it('지도 보기 상태면 장소 폴더 목록 대신 지도를 보여주고, 목록으로 돌아갈 수 있다', async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams('view=map');
    renderTripDetailPage();

    expect(screen.getByText('여행 7 지도')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '지도로 보기' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('link', { name: /서귀포 사진 35장 보기/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '목록으로 보기' }));

    expect(replace).toHaveBeenCalledWith('/trips/7', { scroll: false });
  });

  it('방문 기록이 있어도 헤더 뒤로가기는 생성 화면 대신 여행 목록으로 이동한다', async () => {
    const user = userEvent.setup();
    const historyLength = vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 목록으로 돌아가기' }));

    expect(back).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/trips');
    expect(push).not.toHaveBeenCalled();
    historyLength.mockRestore();
  });

  it('이전 방문 기록이 없으면 여행 목록으로 이동한다', async () => {
    const user = userEvent.setup();
    const historyLength = vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 목록으로 돌아가기' }));

    expect(back).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/trips');
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

  it('장소 폴더가 없고 사진이 있으면 미분류로 안내한다', async () => {
    vi.mocked(getTripPlaceFolders).mockResolvedValue({
      folders: [],
      hasNext: false,
      nextCursor: null,
    });
    renderTripDetailPage();

    expect(
      await screen.findByRole('heading', { name: '장소를 찾은 사진이 없어요' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/위치 정보가 없는 사진은 미분류에 모아뒀어요/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '미분류 사진 보기' })).toHaveAttribute(
      'href',
      `/trips/7/unclassified?trip=${encodeURIComponent('제주도 가을 여행')}`,
    );
  });

  it('총 사진 수가 0장이어도 사진이 모두 미분류에 있으면 미분류로 안내한다', async () => {
    vi.mocked(getTripPlaceFolders).mockResolvedValue({
      folders: [],
      hasNext: false,
      nextCursor: null,
    });
    vi.mocked(getUnclassifiedFolders).mockResolvedValue([
      { issue: 'UNCLEAR_LOCATION', photoCount: 5, thumbnailUrl: null, accent: 'coast' },
    ]);
    renderTripDetailPage({ photoCount: 0 });

    expect(
      await screen.findByRole('heading', { name: '장소를 찾은 사진이 없어요' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '미분류 사진 보기' })).toBeInTheDocument();
    expect(await screen.findByText(/미분류 5장/)).toBeInTheDocument();
    expect(screen.getByText(/정리된 사진 0장/)).toBeInTheDocument();
  });

  it('장소 폴더도 사진도 없으면 사진 추가를 안내한다', async () => {
    vi.mocked(getTripPlaceFolders).mockResolvedValue({
      folders: [],
      hasNext: false,
      nextCursor: null,
    });
    renderTripDetailPage({ photoCount: 0 });

    expect(await screen.findByRole('heading', { name: '아직 사진이 없어요' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '사진 추가하기' })).toHaveAttribute(
      'href',
      '/trips/7/edit?step=images',
    );
  });

  it('서버 값을 먼저 보여주고, 브라우저에서 다시 받은 총 사진 수로 바꾼다', async () => {
    vi.mocked(getTripPlaceFolders).mockResolvedValue(folders);
    renderTripDetailPage({}, { photoCount: 129 });

    expect(screen.getByText(/사진 128장/)).toBeInTheDocument();
    expect(await screen.findByText(/사진 129장/)).toBeInTheDocument();
    expect(fetchTripSummary).toHaveBeenCalledWith(7);
  });

  it('장소 폴더 조회에 실패하면 다시 시도로 재요청한다', async () => {
    vi.mocked(getTripPlaceFolders).mockRejectedValue(new Error('failed'));
    renderTripDetailPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('사진 로드에 실패했어요.');

    vi.mocked(getTripPlaceFolders).mockResolvedValue(folders);
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('link', { name: /서귀포/ })).toBeInTheDocument();
  });

  it('더보기 메뉴에서 공유하기를 누르면 공유 모달을 연다', async () => {
    const user = userEvent.setup();
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '공유하기' }));

    expect(
      screen.getByRole('dialog', { name: '공유할 이메일을 입력해주세요' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '공유할 이메일' })).toBeInTheDocument();
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
