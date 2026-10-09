import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PhotoListItem } from '@/features/photoList/model/types';
import { deleteUnclassifiedPhotos } from '@/features/unclassifiedPhotos/api/deleteUnclassifiedPhotos';
import { getUnclassifiedPhotos } from '@/features/unclassifiedPhotos/api/getUnclassifiedPhotos';
import { restoreUnclassifiedPhotos } from '@/features/unclassifiedPhotos/api/restoreUnclassifiedPhotos';

import { UnclassifiedPhotoListPage } from './unclassifiedPhotoListPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/features/unclassifiedPhotos/api/getUnclassifiedPhotos', () => ({
  getUnclassifiedPhotos: vi.fn(),
}));
vi.mock('@/features/unclassifiedPhotos/api/restoreUnclassifiedPhotos', () => ({
  restoreUnclassifiedPhotos: vi.fn(),
}));
vi.mock('@/features/unclassifiedPhotos/api/deleteUnclassifiedPhotos', () => ({
  deleteUnclassifiedPhotos: vi.fn(),
}));

vi.mock('@/features/photoList/model/usePhotoOriginal', () => ({
  usePhotoOriginal: () => null,
}));
vi.mock('@/features/photoList/model/usePhotoDownload', () => ({
  usePhotoDownload: () => ({ mutate: requestDownload }),
}));
const { requestDownload } = vi.hoisted(() => ({ requestDownload: vi.fn() }));

const photos: PhotoListItem[] = [1, 2, 3].map((id) => ({
  id,
  thumbnailUrl: null,
  accent: 'coast',
}));

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
    vi.mocked(getUnclassifiedPhotos).mockResolvedValue(photos);
    vi.mocked(restoreUnclassifiedPhotos).mockResolvedValue(undefined);
    vi.mocked(deleteUnclassifiedPhotos).mockResolvedValue(undefined);
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
      expect(restoreUnclassifiedPhotos).toHaveBeenCalledWith(7, { photoIds: [1, 3] }),
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

    await waitFor(() => expect(deleteUnclassifiedPhotos).toHaveBeenCalledWith(7, [1, 2, 3]));
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

  it('상세보기에서 개별 다운로드와 삭제 확인을 지원한다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: '2번째 사진 상세보기' }));
    await user.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '원본 다운로드' }));
    expect(requestDownload).toHaveBeenCalledWith([2]);

    await user.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '삭제' }));
    let dialog = screen.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' });
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(deleteUnclassifiedPhotos).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '사진 원본 보기' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '삭제' }));
    dialog = screen.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' });
    await user.click(within(dialog).getByRole('button', { name: '삭제하기' }));
    await waitFor(() => expect(deleteUnclassifiedPhotos).toHaveBeenCalledWith(7, [2]));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('사진이 없으면 빈 상태를 보여주고 작업 버튼을 숨긴다', async () => {
    vi.mocked(getUnclassifiedPhotos).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('폴더에 사진이 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });
});
