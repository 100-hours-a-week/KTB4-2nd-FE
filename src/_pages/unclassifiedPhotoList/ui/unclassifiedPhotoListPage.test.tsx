import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deletePhoto, deletePhotos } from '@/features/photoList/api/photoDelete';
import { getTripPlaceFolders } from '@/features/tripDetail/api/getTripPlaceFolders';
import { getUnclassifiedPhotos } from '@/features/unclassifiedPhotos/api/getUnclassifiedPhotos';
import {
  restoreAttachment,
  restoreAttachments,
} from '@/features/unclassifiedPhotos/api/restoreUnclassifiedPhotos';
import type { UnclassifiedPhoto } from '@/features/unclassifiedPhotos/model/types';

import { UnclassifiedPhotoListPage } from './unclassifiedPhotoListPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/features/unclassifiedPhotos/api/getUnclassifiedPhotos', () => ({
  getUnclassifiedPhotos: vi.fn(),
  getAllUnclassifiedPhotos: vi.fn(),
}));
vi.mock('@/features/unclassifiedPhotos/api/restoreUnclassifiedPhotos', () => ({
  restoreAttachment: vi.fn(),
  restoreAttachments: vi.fn(),
}));
vi.mock('@/features/photoList/api/photoDelete', () => ({
  deletePhoto: vi.fn(),
  deletePhotos: vi.fn(),
}));
vi.mock('@/features/tripDetail/api/getTripPlaceFolders', () => ({ getTripPlaceFolders: vi.fn() }));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));

vi.mock('@/features/photoList/model/usePhotoOriginal', () => ({
  usePhotoOriginal: () => null,
}));
const photos: UnclassifiedPhoto[] = [1, 2, 3].map((id) => ({
  id,
  thumbnailUrl: null,
  accent: 'coast',
  restoreTripPlaceId: id * 10,
}));

function page(items: UnclassifiedPhoto[]) {
  return { photos: items, totalCount: items.length, hasNext: false, nextCursor: null };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UnclassifiedPhotoListPage tripId={7} tripName="제주도 가을 여행" issue="BLURRY" />
    </QueryClientProvider>,
  );
}

describe('UnclassifiedPhotoListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUnclassifiedPhotos).mockResolvedValue(page(photos));
    vi.mocked(restoreAttachment).mockResolvedValue(undefined);
    vi.mocked(restoreAttachments).mockResolvedValue(undefined);
    vi.mocked(deletePhoto).mockResolvedValue(undefined);
    vi.mocked(deletePhotos).mockResolvedValue(undefined);
    vi.mocked(getTripPlaceFolders).mockResolvedValue({
      folders: [{ id: 99, name: '성산일출봉', photoCount: 4, thumbnailUrl: null, accent: 'coast' }],
      hasNext: false,
      nextCursor: null,
    });
  });

  it('선택 모드에서 선택한 사진만 해제하고 일반 보기로 돌아온다', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: '흐릿한 사진' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: '선택' }));
    expect(screen.getByRole('heading', { name: '0장 선택됨' })).toBeInTheDocument();
    expect(screen.getByText('제주도 가을 여행 · 사진을 눌러 선택하세요')).toBeInTheDocument();
    const toolbar = screen.getByRole('toolbar', { name: '선택한 사진 작업' });
    expect(within(toolbar).getByRole('button', { name: '해제' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await user.click(screen.getByRole('button', { name: '3번째 사진 선택' }));
    expect(screen.getByRole('heading', { name: '2장 선택됨' })).toBeInTheDocument();

    await user.click(within(toolbar).getByRole('button', { name: '해제' }));

    await waitFor(() =>
      expect(restoreAttachments).toHaveBeenCalledWith(
        [
          { tripAttachmentId: 1, tripPlaceId: 10 },
          { tripAttachmentId: 3, tripPlaceId: 30 },
        ],
        'csrf-token',
      ),
    );
    await waitFor(() => expect(screen.queryByRole('toolbar')).not.toBeInTheDocument());
  });

  it('전체 선택 후 확인을 거쳐 삭제한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '선택' }));
    await user.click(screen.getByRole('button', { name: '전체 선택' }));
    expect(screen.getByRole('button', { name: '전체 해제' })).toBeInTheDocument();

    const toolbar = screen.getByRole('toolbar', { name: '선택한 사진 작업' });
    await user.click(within(toolbar).getByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('alertdialog', { name: '사진 3장을 삭제하시겠습니까?' });
    await user.click(within(dialog).getByRole('button', { name: '삭제하기' }));

    await waitFor(() => expect(deletePhotos).toHaveBeenCalledWith([1, 2, 3], 'csrf-token'));
  });

  it('처음에는 일반 보기이고 취소 후 다시 진입하면 선택이 초기화된다', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('제주도 가을 여행 · 사진 3장')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /번째 사진 상세보기/ })).toHaveLength(3);
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '전체 선택' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1번째 사진 선택' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '선택' }));
    await user.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.getByRole('heading', { name: '흐릿한 사진' })).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미분류 폴더로 돌아가기' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '선택' }));
    expect(screen.getByRole('heading', { name: '0장 선택됨' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1번째 사진 선택' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('일반 보기에서 상세보기를 열고 키보드로 탐색하고 닫는다', async () => {
    const user = userEvent.setup();
    renderPage();
    const trigger = await screen.findByRole('button', { name: '1번째 사진 상세보기' });
    await user.click(trigger);

    const viewer = screen.getByRole('dialog', { name: '사진 원본 보기' });
    expect(within(viewer).getByLabelText('사진 순서')).toHaveTextContent('1 / 3');
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(within(viewer).getByLabelText('사진 순서')).toHaveTextContent('2 / 3');
    await user.click(within(viewer).getByRole('button', { name: '다음 사진' }));
    expect(within(viewer).getByLabelText('사진 순서')).toHaveTextContent('3 / 3');
    await user.keyboard('{ArrowLeft}');
    expect(within(viewer).getByLabelText('사진 순서')).toHaveTextContent('2 / 3');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('상세보기 메뉴에서 현재 사진만 복구하고 뷰어를 닫는다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: '2번째 사진 상세보기' }));
    await user.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    expect(screen.queryByRole('menuitem', { name: '원본 다운로드' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: '복구' }));
    await waitFor(() =>
      expect(restoreAttachment).toHaveBeenCalledWith(
        { tripAttachmentId: 2, tripPlaceId: 20 },
        'csrf-token',
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('상세보기에서 삭제 확인을 지원한다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: '2번째 사진 상세보기' }));
    await user.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '삭제' }));
    let dialog = screen.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' });
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(deletePhoto).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '사진 원본 보기' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '삭제' }));
    dialog = screen.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' });
    await user.click(within(dialog).getByRole('button', { name: '삭제하기' }));
    await waitFor(() => expect(deletePhoto).toHaveBeenCalledWith(2, 'csrf-token'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('사진이 없으면 빈 상태를 보여주고 작업 버튼을 숨긴다', async () => {
    vi.mocked(getUnclassifiedPhotos).mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText('폴더에 사진이 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('사진은 페이지를 모두 이어서 불러온다', async () => {
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce({ ...page(photos.slice(0, 2)), hasNext: true, nextCursor: 'next' })
      .mockResolvedValueOnce(page(photos.slice(2)));
    renderPage();

    expect(await screen.findByText('제주도 가을 여행 · 사진 3장')).toBeInTheDocument();
    expect(getUnclassifiedPhotos).toHaveBeenLastCalledWith(7, 'BLURRY', 'next');
  });

  it('장소를 알 수 없는 사진을 복구하면 되돌릴 폴더를 고르게 한다', async () => {
    vi.mocked(getUnclassifiedPhotos).mockResolvedValue(
      page([{ ...photos[0], restoreTripPlaceId: null }, photos[1]]),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '선택' }));
    await user.click(screen.getByRole('button', { name: '전체 선택' }));
    const toolbar = screen.getByRole('toolbar', { name: '선택한 사진 작업' });
    await user.click(within(toolbar).getByRole('button', { name: '해제' }));

    const picker = await screen.findByRole('dialog', { name: '어느 폴더로 되돌릴까요?' });
    expect(restoreAttachments).not.toHaveBeenCalled();
    await user.click(await within(picker).findByRole('radio', { name: /성산일출봉/ }));
    await user.click(within(picker).getByRole('button', { name: '되돌리기' }));

    await waitFor(() =>
      expect(restoreAttachments).toHaveBeenCalledWith(
        [
          { tripAttachmentId: 1, tripPlaceId: 99 },
          { tripAttachmentId: 2, tripPlaceId: 20 },
        ],
        'csrf-token',
      ),
    );
  });
});
