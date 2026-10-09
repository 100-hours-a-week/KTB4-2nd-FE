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

  it('사진을 눌러 바로 선택하고 선택한 사진만 해제한다', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: '흐릿한 사진' })).toBeInTheDocument();
    const toolbar = await screen.findByRole('toolbar', { name: '선택한 사진 작업' });
    expect(within(toolbar).getByRole('button', { name: '해제' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await user.click(screen.getByRole('button', { name: '3번째 사진 선택' }));
    expect(screen.getByText('제주도 가을 여행 · 선택된 사진 2장')).toBeInTheDocument();

    await user.click(within(toolbar).getByRole('button', { name: '해제' }));

    await waitFor(() =>
      expect(restoreUnclassifiedPhotos).toHaveBeenCalledWith(7, { photoIds: [1, 3] }),
    );
  });

  it('전체 선택 후 확인을 거쳐 삭제한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '전체 선택' }));
    expect(screen.getByRole('button', { name: '선택 취소' })).toBeInTheDocument();

    const toolbar = screen.getByRole('toolbar', { name: '선택한 사진 작업' });
    await user.click(within(toolbar).getByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('alertdialog', { name: '사진 3장을 삭제하시겠습니까?' });
    await user.click(within(dialog).getByRole('button', { name: '삭제하기' }));

    await waitFor(() => expect(deleteUnclassifiedPhotos).toHaveBeenCalledWith(7, [1, 2, 3]));
  });

  it('사진이 없으면 빈 상태를 보여주고 작업 버튼을 숨긴다', async () => {
    vi.mocked(getUnclassifiedPhotos).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('폴더에 사진이 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });
});
