import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPhotoOriginal } from '@/features/photoList/api/getPhotoOriginal';
import { getPlacePhotos } from '@/features/photoList/api/getPlacePhotos';
import type { PlacePhotoPageResult } from '@/features/photoList/api/getPlacePhotos';
import { deletePhoto, deletePhotos } from '@/features/photoList/api/photoDelete';
import {
  issueBulkPhotoDownloadUrl,
  issuePhotoDownloadUrl,
} from '@/features/photoList/api/photoDownload';
import { triggerDownload } from '@/features/photoList/lib/triggerDownload';
import type { PhotoListItem } from '@/features/photoList/model/types';

import { PhotoListPage } from './photoListPage';

vi.mock('@/features/photoList/api/getPlacePhotos', () => ({ getPlacePhotos: vi.fn() }));
vi.mock('@/features/photoList/api/getPhotoOriginal', () => ({ getPhotoOriginal: vi.fn() }));
vi.mock('@/features/photoList/api/photoDelete', () => ({
  deletePhoto: vi.fn(),
  deletePhotos: vi.fn(),
}));
vi.mock('@/features/photoList/api/photoDownload', () => ({
  issuePhotoDownloadUrl: vi.fn(),
  issueBulkPhotoDownloadUrl: vi.fn(),
}));
vi.mock('@/features/photoList/lib/triggerDownload', () => ({ triggerDownload: vi.fn() }));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));

const accents = ['coast', 'night', 'blossom'] as const;

function photo(id: number): PhotoListItem {
  return { id, thumbnailUrl: null, accent: accents[id % accents.length] };
}

function page(photos: PhotoListItem[], nextCursor: string | null = null): PlacePhotoPageResult {
  return { photos, hasNext: nextCursor !== null, nextCursor };
}

function renderPhotoListPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PhotoListPage tripId={7} tripPlaceId={3} tripName="제주도 가을 여행" placeName="제주시" />
    </QueryClientProvider>,
  );
}

async function findFirstPhoto() {
  return screen.findByRole('button', { name: '1번째 사진 보기' });
}

describe('PhotoListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPlacePhotos).mockResolvedValue(page([photo(1), photo(2), photo(3)]));
    vi.mocked(getPhotoOriginal).mockResolvedValue({
      tripAttachmentId: 1,
      originalUrl: 'https://cdn.test/1-original.jpg',
    });
  });

  it('장소 사진 목록 API 결과와 장수를 표시한다', async () => {
    renderPhotoListPage();

    expect(screen.getByRole('heading', { level: 1, name: '제주시' })).toBeInTheDocument();
    expect(await findFirstPhoto()).toBeInTheDocument();
    expect(screen.getByText(/사진 3장/)).toBeInTheDocument();
    expect(getPlacePhotos).toHaveBeenCalledWith(7, 3, null);
  });

  it('다음 커서가 있으면 사진을 이어서 모두 불러온다', async () => {
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1), photo(2)], 'cursor-2'))
      .mockResolvedValueOnce(page([photo(3)]));

    renderPhotoListPage();

    expect(await screen.findByRole('button', { name: '3번째 사진 보기' })).toBeInTheDocument();
    expect(getPlacePhotos).toHaveBeenLastCalledWith(7, 3, 'cursor-2');
    expect(screen.getByText(/사진 3장/)).toBeInTheDocument();
  });

  it('목록 조회에 실패하면 다시 시도로 재요청한다', async () => {
    vi.mocked(getPlacePhotos).mockRejectedValue(new Error('failed'));
    renderPhotoListPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('사진을 가져오지 못했어요.');

    vi.mocked(getPlacePhotos).mockResolvedValue(page([photo(1)]));
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await findFirstPhoto()).toBeInTheDocument();
  });

  it('사진이 없으면 빈 폴더 안내를 표시한다', async () => {
    vi.mocked(getPlacePhotos).mockResolvedValue(page([]));
    renderPhotoListPage();

    expect(await screen.findByText('폴더에 사진이 없어요')).toBeInTheDocument();
  });

  it('사진을 누르면 원본 API로 원본 URL을 받아 보여준다', async () => {
    renderPhotoListPage();

    await userEvent.click(await findFirstPhoto());

    expect(screen.getByRole('dialog', { name: '사진 원본 보기' })).toBeInTheDocument();
    await waitFor(() => expect(getPhotoOriginal).toHaveBeenCalledWith(1));
  });

  it('원본 보기에서 다운로드를 누르면 단일 다운로드 URL을 발급받아 내려받는다', async () => {
    vi.mocked(issuePhotoDownloadUrl).mockResolvedValue({
      tripAttachmentId: 1,
      downloadUrl: 'https://cdn.test/1.jpg',
    });
    renderPhotoListPage();

    await userEvent.click(await findFirstPhoto());
    await userEvent.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    await userEvent.click(screen.getByRole('menuitem', { name: '원본 다운로드' }));

    await waitFor(() => expect(issuePhotoDownloadUrl).toHaveBeenCalledWith(1));
    expect(triggerDownload).toHaveBeenCalledWith('https://cdn.test/1.jpg', undefined);
  });

  it('여러 장을 선택해 다운로드하면 일괄 다운로드 URL을 발급받는다', async () => {
    vi.mocked(issueBulkPhotoDownloadUrl).mockResolvedValue({
      fileName: 'jeju.zip',
      downloadUrl: 'https://cdn.test/jeju.zip',
    });
    renderPhotoListPage();
    await findFirstPhoto();

    await userEvent.click(screen.getByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    await userEvent.click(screen.getByRole('button', { name: /다운로드/ }));

    await waitFor(() =>
      expect(issueBulkPhotoDownloadUrl).toHaveBeenCalledWith([1, 2, 3], 'csrf-token'),
    );
    expect(triggerDownload).toHaveBeenCalledWith('https://cdn.test/jeju.zip', 'jeju.zip');
  });

  it('선택한 사진을 확인 후 일괄 삭제 API로 지운다', async () => {
    vi.mocked(deletePhotos).mockResolvedValue(undefined);
    renderPhotoListPage();
    await findFirstPhoto();

    await userEvent.click(screen.getByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    await userEvent.click(screen.getByRole('button', { name: /삭제/ }));

    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제하기' }));

    await waitFor(() => expect(deletePhotos).toHaveBeenCalledWith([1, 2, 3], 'csrf-token'));
  });

  it('원본 보기에서 한 장만 지우면 단일 삭제 API를 쓴다', async () => {
    vi.mocked(deletePhoto).mockResolvedValue(undefined);
    renderPhotoListPage();

    await userEvent.click(await findFirstPhoto());
    await userEvent.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    await userEvent.click(screen.getByRole('menuitem', { name: '삭제' }));

    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제하기' }));

    await waitFor(() => expect(deletePhoto).toHaveBeenCalledWith(1, 'csrf-token'));
  });

  it('사진을 길게 누르면 선택 모드로 전환하고 누른 사진을 선택한다', async () => {
    renderPhotoListPage();
    const first = await findFirstPhoto();

    vi.useFakeTimers();
    fireEvent.pointerDown(first, { pointerId: 1, pointerType: 'touch', button: 0 });
    act(() => vi.advanceTimersByTime(600));
    fireEvent.pointerUp(first, { pointerId: 1, pointerType: 'touch', button: 0 });
    fireEvent.click(first);
    vi.useRealTimers();

    expect(screen.getByRole('heading', { level: 1, name: '1장 선택됨' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1번째 사진 선택 해제' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
