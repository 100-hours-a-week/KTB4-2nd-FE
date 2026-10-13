import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTripPlaceFolders } from '@/features/tripDetail/api/getTripPlaceFolders';
import { getUnclassifiedFolders } from '@/features/unclassifiedPhotos/api/getUnclassifiedFolders';
import { getAllUnclassifiedPhotos } from '@/features/unclassifiedPhotos/api/getUnclassifiedPhotos';
import { restoreAttachments } from '@/features/unclassifiedPhotos/api/restoreUnclassifiedPhotos';
import type {
  UnclassifiedFolder,
  UnclassifiedPhoto,
} from '@/features/unclassifiedPhotos/model/types';

import { UnclassifiedFolderPage } from './unclassifiedFolderPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/features/unclassifiedPhotos/api/getUnclassifiedFolders', () => ({
  getUnclassifiedFolders: vi.fn(),
}));
vi.mock('@/features/unclassifiedPhotos/api/getUnclassifiedPhotos', () => ({
  getUnclassifiedPhotos: vi.fn(),
  getAllUnclassifiedPhotos: vi.fn(),
}));
vi.mock('@/features/unclassifiedPhotos/api/restoreUnclassifiedPhotos', () => ({
  restoreAttachment: vi.fn(),
  restoreAttachments: vi.fn(),
}));
vi.mock('@/features/tripDetail/api/getTripPlaceFolders', () => ({ getTripPlaceFolders: vi.fn() }));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));

function photo(id: number, restoreTripPlaceId: number | null): UnclassifiedPhoto {
  return { id, thumbnailUrl: null, accent: 'coast', restoreTripPlaceId };
}

const folders: UnclassifiedFolder[] = [
  { issue: 'UNCLEAR_LOCATION', photoCount: 14, thumbnailUrl: null, accent: 'island' },
  { issue: 'BLURRY', photoCount: 0, thumbnailUrl: null, accent: 'night' },
  { issue: 'DUPLICATED', photoCount: 35, thumbnailUrl: null, accent: 'coast' },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UnclassifiedFolderPage tripId={7} tripName="제주도 가을 여행" />
    </QueryClientProvider>,
  );
}

describe('UnclassifiedFolderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUnclassifiedFolders).mockResolvedValue(folders);
    vi.mocked(getAllUnclassifiedPhotos).mockResolvedValue([photo(1, 11), photo(2, 12)]);
    vi.mocked(restoreAttachments).mockResolvedValue(undefined);
    vi.mocked(getTripPlaceFolders).mockResolvedValue({
      folders: [{ id: 11, name: '서귀포', photoCount: 5, thumbnailUrl: null, accent: 'coast' }],
      hasNext: false,
      nextCursor: null,
    });
  });

  it('사진이 있는 사유 폴더만 보여주고 전체 장수를 합산한다', async () => {
    renderPage();

    expect(await screen.findByText('49장')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '장소가 애매한 사진 14장 보기' })).toHaveAttribute(
      'href',
      `/trips/7/unclassified/unclear-location?trip=${encodeURIComponent('제주도 가을 여행')}`,
    );
    expect(screen.getByRole('link', { name: '중복 사진 35장 보기' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /흐릿한 사진/ })).not.toBeInTheDocument();
  });

  it('폴더 해제는 확인 후 해당 사유 사진을 모두 원래 장소로 되돌린다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '중복 사진 전체 해제' }));
    const dialog = screen.getByRole('dialog', { name: '중복 사진 35장을 해제할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '해제하기' }));

    await waitFor(() =>
      expect(restoreAttachments).toHaveBeenCalledWith(
        [
          { tripAttachmentId: 1, tripPlaceId: 11 },
          { tripAttachmentId: 2, tripPlaceId: 12 },
        ],
        'csrf-token',
      ),
    );
    expect(getAllUnclassifiedPhotos).toHaveBeenCalledWith(7, 'DUPLICATED');
  });

  it('장소를 알 수 없는 사진이 있으면 되돌릴 폴더를 고른 뒤 복구한다', async () => {
    vi.mocked(getAllUnclassifiedPhotos).mockResolvedValue([photo(1, null), photo(2, 12)]);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '장소가 애매한 사진 전체 해제' }));
    await user.click(
      within(screen.getByRole('dialog', { name: /해제할까요/ })).getByRole('button', {
        name: '해제하기',
      }),
    );

    const picker = await screen.findByRole('dialog', { name: '어느 폴더로 되돌릴까요?' });
    expect(picker).toHaveTextContent('장소를 알 수 없는 사진 1장');
    expect(restoreAttachments).not.toHaveBeenCalled();

    await user.click(await within(picker).findByRole('radio', { name: /서귀포/ }));
    await user.click(within(picker).getByRole('button', { name: '되돌리기' }));

    await waitFor(() =>
      expect(restoreAttachments).toHaveBeenCalledWith(
        [
          { tripAttachmentId: 1, tripPlaceId: 11 },
          { tripAttachmentId: 2, tripPlaceId: 12 },
        ],
        'csrf-token',
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('모든 폴더가 비어 있으면 빈 상태를 보여준다', async () => {
    vi.mocked(getUnclassifiedFolders).mockResolvedValue(
      folders.map((folder) => ({ ...folder, photoCount: 0 })),
    );
    renderPage();

    expect(await screen.findByText('확인할 사진이 없어요')).toBeInTheDocument();
  });

  it('불러오기에 실패하면 토스트로 다시 시도를 안내한다', async () => {
    vi.mocked(getUnclassifiedFolders).mockRejectedValue(new Error('failed'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('사진 로드에 실패했어요.');
  });
});
