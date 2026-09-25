import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTripPlaceFolders } from '@/features/tripDetail/api/getTripPlaceFolders';
import type { TripPlaceFolderPageResult } from '@/features/tripDetail/api/getTripPlaceFolders';
import type { TripDetail } from '@/features/tripDetail/model/types';
import { toast } from '@/shared/ui/toast';

import { TripDetailPage } from './tripDetailPage';

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

function renderTripDetailPage(props: Partial<{ onDelete: (tripId: number) => void }> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <TripDetailPage trip={trip} {...props} />
    </QueryClientProvider>,
  );
}

describe('TripDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTripPlaceFolders).mockResolvedValue(folders);
  });

  it('여행 정보와 장소 폴더 API 결과를 표시한다', async () => {
    renderTripDetailPage();

    expect(screen.getByRole('heading', { level: 1, name: '제주도 가을 여행' })).toBeInTheDocument();
    expect(screen.getByText('서귀포시 외 2개')).toBeInTheDocument();
    expect(screen.getByText('사진 128장')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /서귀포/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /성산일출봉/ })).toBeInTheDocument();
    expect(getTripPlaceFolders).toHaveBeenCalledWith(7, null);
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

    expect(await screen.findByRole('button', { name: /우도/ })).toBeInTheDocument();
    expect(getTripPlaceFolders).toHaveBeenLastCalledWith(7, 'cursor-2');
  });

  it('장소 폴더 조회에 실패하면 다시 시도로 재요청한다', async () => {
    vi.mocked(getTripPlaceFolders).mockRejectedValue(new Error('failed'));
    renderTripDetailPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('사진 로드에 실패했어요.');

    vi.mocked(getTripPlaceFolders).mockResolvedValue(folders);
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('button', { name: /서귀포/ })).toBeInTheDocument();
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

  it('삭제 API가 없어 삭제 함수가 없으면 지원하지 않는다고 알린다', async () => {
    const warning = vi.spyOn(toast, 'warning');
    const user = userEvent.setup();
    renderTripDetailPage();

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '여행 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    expect(warning).toHaveBeenCalledWith('아직 지원하지 않는 기능이에요.');
  });

  it('삭제 확인 시 전달받은 삭제 함수를 호출한다', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderTripDetailPage({ onDelete });

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '여행 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    expect(onDelete).toHaveBeenCalledWith(7);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
