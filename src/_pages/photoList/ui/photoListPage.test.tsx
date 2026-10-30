import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const { back, replace } = vi.hoisted(() => ({
  back: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back, replace }),
}));

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

type Observed = {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  disconnected: boolean;
  target?: Element;
};
const observed: Observed[] = [];
function installObserver() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      state: Observed;
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.state = { callback, options, disconnected: false };
        observed.push(this.state);
      }
      observe(target: Element) {
        this.state.target = target;
      }
      disconnect() {
        this.state.disconnected = true;
      }
    },
  );
}
afterEach(() => {
  vi.unstubAllGlobals();
  observed.length = 0;
});

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
    expect(getPlacePhotos).toHaveBeenCalledWith(7, 3, null, expect.any(AbortSignal));
  });

  it('조회 중에는 단일 SVG 배경으로 6행 스켈레톤을 보여주고 완료 후 제거한다', async () => {
    let finish!: (result: PlacePhotoPageResult) => void;
    vi.mocked(getPlacePhotos).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderPhotoListPage();

    const loading = screen.getByRole('status', { name: '사진 불러오는 중' });
    expect(loading).toHaveAttribute('aria-busy', 'true');
    const background = loading.querySelector('div[aria-hidden="true"]');
    expect(background).toHaveStyle({
      backgroundRepeat: 'repeat',
      paddingBottom: 'calc((100% + 4px) / 3 * 6 - 4px)',
    });
    expect(background?.childElementCount).toBe(0);

    await act(async () => {
      finish(page([photo(1)]));
    });
    await findFirstPhoto();
    expect(screen.queryByRole('status', { name: '사진 불러오는 중' })).not.toBeInTheDocument();
  });

  it('헤더의 뒤로가기는 여행 상세를 새로 쌓지 않고 이전 기록으로 돌아간다', async () => {
    const historyLength = vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    renderPhotoListPage();

    await userEvent.click(screen.getByRole('button', { name: '여행 상세로 돌아가기' }));

    expect(back).toHaveBeenCalledOnce();
    expect(replace).not.toHaveBeenCalled();
    historyLength.mockRestore();
  });

  it('이전 기록 없이 사진 목록에 직접 들어오면 여행 상세로 대체 이동한다', async () => {
    const historyLength = vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    renderPhotoListPage();

    await userEvent.click(screen.getByRole('button', { name: '여행 상세로 돌아가기' }));

    expect(back).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/trips/7');
    historyLength.mockRestore();
  });

  it('다음 커서가 있어도 첫 페이지를 즉시 보여주고 요청할 때만 추가한다', async () => {
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1), photo(2)], 'cursor-2'))
      .mockResolvedValueOnce(page([photo(3)]));

    renderPhotoListPage();

    expect(await findFirstPhoto()).toBeInTheDocument();
    expect(getPlacePhotos).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/사진 2장 불러옴/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '사진 더 불러오기' }));
    expect(await screen.findByRole('button', { name: '3번째 사진 보기' })).toBeInTheDocument();
    expect(getPlacePhotos).toHaveBeenLastCalledWith(7, 3, 'cursor-2', expect.any(AbortSignal));
    expect(screen.getByText(/사진 3장/)).toBeInTheDocument();
  });

  it('내부 스크롤 영역을 관찰하고 동시에 도착한 관찰 이벤트는 한 번만 요청한다', async () => {
    installObserver();
    let finish!: (value: PlacePhotoPageResult) => void;
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1)], 'next'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const view = renderPhotoListPage();
    view.container.style.overflowY = 'auto';
    await findFirstPhoto();
    await waitFor(() => expect(observed.length).toBeGreaterThan(0));
    const observer = observed.at(-1)!;
    expect(observer.options?.root).toBe(view.container);
    expect(observer.options?.rootMargin).toBe('400px');
    act(() => {
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(getPlacePhotos).toHaveBeenCalledTimes(2);
    expect(await findFirstPhoto()).toBeInTheDocument();
    const loading = screen.getByRole('status', { name: '사진 추가 로딩 중' });
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading.querySelector('div[aria-hidden="true"]')).toHaveStyle({
      paddingBottom: 'calc((100% + 4px) / 3 * 2 - 4px)',
    });
    const loadingButton = screen.getByRole('button', { name: '사진 불러오는 중…' });
    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    await act(async () => finish(page([photo(2)])));
    expect(await screen.findByRole('button', { name: '2번째 사진 보기' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: '사진 추가 로딩 중' })).not.toBeInTheDocument();
  });

  it('추가 조회 실패 시 기존 사진을 유지하고 다음 페이지만 다시 시도한다', async () => {
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1)], 'next'))
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce(page([photo(2)]));
    renderPhotoListPage();
    await findFirstPhoto();
    await userEvent.click(screen.getByRole('button', { name: '사진 더 불러오기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 불러온 사진은 볼 수 있어요');
    expect(screen.getByRole('button', { name: '1번째 사진 보기' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '사진 추가 로딩 다시 시도' }));
    expect(await screen.findByRole('button', { name: '2번째 사진 보기' })).toBeInTheDocument();
    expect(getPlacePhotos).toHaveBeenCalledTimes(3);
  });

  it('전체 선택을 누른 경우에만 남은 페이지를 모두 가져와 선택한다', async () => {
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1)], 'second'))
      .mockResolvedValueOnce(page([photo(2)], 'third'))
      .mockResolvedValueOnce(page([photo(3)]));
    renderPhotoListPage();
    await findFirstPhoto();
    expect(getPlacePhotos).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    expect(await screen.findByRole('heading', { name: '3장 선택됨' })).toBeInTheDocument();
    expect(getPlacePhotos).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('button', { name: '전체 해제' })).toBeInTheDocument();
  });

  it('전체 선택을 취소하면 요청을 중단하고 이전 선택을 유지한다', async () => {
    let requestedSignal: AbortSignal | undefined;
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1), photo(2)], 'next'))
      .mockImplementationOnce(
        (_trip, _place, _cursor, signal) =>
          new Promise((_resolve, reject) => {
            requestedSignal = signal;
            signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
          }),
      );
    renderPhotoListPage();
    await findFirstPhoto();
    await userEvent.click(screen.getByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    expect(await screen.findByRole('region', { name: '전체 선택 진행 안내' })).toBeInTheDocument();
    expect(screen.getByText('전체 선택 중')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1번째 사진 선택 해제' })).toBeDisabled();
    expect(screen.queryByRole('toolbar', { name: '선택한 사진 작업' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '불러오기 취소' }));
    expect(requestedSignal?.aborted).toBe(true);
    expect(screen.getByRole('heading', { name: '1장 선택됨' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2번째 사진 선택' })).toBeInTheDocument();
  });

  it('전체 선택 도중 실패해도 일부만 전체 선택된 것으로 반영하지 않는다', async () => {
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1)], 'second'))
      .mockResolvedValueOnce(page([photo(2)], 'third'))
      .mockRejectedValueOnce(new Error('failed'));
    renderPhotoListPage();
    await findFirstPhoto();
    await userEvent.click(screen.getByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '전체 선택' })).toBeEnabled());
    expect(screen.getByRole('heading', { name: '1장 선택됨' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2번째 사진 선택' })).toBeInTheDocument();
  });

  it('뷰어에서 로드된 마지막 사진 다음으로 이동하면 다음 페이지를 받아 이동한다', async () => {
    let finish!: (value: PlacePhotoPageResult) => void;
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1), photo(2)], 'next'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    renderPhotoListPage();
    await userEvent.click(await findFirstPhoto());
    expect(screen.getByRole('button', { name: '이전 사진' })).toBeDisabled();
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('1 / 2+');
    await userEvent.click(screen.getByRole('button', { name: '다음 사진' }));
    await userEvent.click(screen.getByRole('button', { name: '다음 사진' }));
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('2 / 2+');
    expect(screen.getByRole('button', { name: '다음 사진' })).toBeDisabled();
    await act(async () => finish(page([photo(3)])));
    await waitFor(() => expect(screen.getByLabelText('사진 순서')).toHaveTextContent('3 / 3'));
  });

  it('뷰어를 닫은 뒤 다음 페이지가 도착해도 다시 열지 않는다', async () => {
    let finish!: (value: PlacePhotoPageResult) => void;
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1)], 'next'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    renderPhotoListPage();
    await userEvent.click(await findFirstPhoto());
    await userEvent.click(screen.getByRole('button', { name: '다음 사진' }));
    await userEvent.click(screen.getByRole('button', { name: '원본 보기 닫기' }));
    await act(async () => finish(page([photo(2)])));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('반복 cursor를 더 요청하지 않고 중복 사진을 제거한다', async () => {
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([photo(1)], 'repeat'))
      .mockResolvedValueOnce(page([photo(1), photo(2)], 'repeat'));
    renderPhotoListPage();
    await findFirstPhoto();
    await userEvent.click(screen.getByRole('button', { name: '사진 더 불러오기' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: '사진 목록' })).getAllByRole('button'),
    ).toHaveLength(2);
    expect(getPlacePhotos).toHaveBeenCalledTimes(2);
  });

  it('목록 조회에 실패하면 다시 시도로 재요청한다', async () => {
    vi.mocked(getPlacePhotos).mockRejectedValue(new Error('failed'));
    renderPhotoListPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('사진을 가져오지 못했어요.');
    expect(screen.queryByRole('status', { name: '사진 불러오는 중' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: '사진 불러오는 중' })).not.toBeInTheDocument();

    vi.mocked(getPlacePhotos).mockResolvedValue(page([photo(1)]));
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await findFirstPhoto()).toBeInTheDocument();
  });

  it('사진이 없으면 빈 폴더 안내를 표시한다', async () => {
    vi.mocked(getPlacePhotos).mockResolvedValue(page([]));
    renderPhotoListPage();

    expect(await screen.findByText('폴더에 사진이 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '선택' })).not.toBeInTheDocument();
  });

  it('사진을 누르면 원본 API로 원본 URL을 받아 보여준다', async () => {
    renderPhotoListPage();

    await userEvent.click(await findFirstPhoto());

    expect(screen.getByRole('dialog', { name: '사진 원본 보기' })).toBeInTheDocument();
    await waitFor(() => expect(getPhotoOriginal).toHaveBeenCalledWith(1));
  });

  it('키보드로 사진을 순환하고 Escape로 닫으면 원래 사진으로 포커스를 돌려준다', async () => {
    const user = userEvent.setup();
    renderPhotoListPage();
    const first = await findFirstPhoto();
    first.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: '원본 보기 닫기' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('2 / 3');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('1 / 3');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('3 / 3');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('1 / 3');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: '사진 원본 보기' })).not.toBeInTheDocument();
    expect(first).toHaveFocus();
  });

  it('Tab과 Shift+Tab 포커스가 사진 뷰어 안에서 순환한다', async () => {
    const user = userEvent.setup();
    renderPhotoListPage();
    await user.click(await findFirstPhoto());
    const close = screen.getByRole('button', { name: '원본 보기 닫기' });
    const next = screen.getByRole('button', { name: '다음 사진' });

    await user.tab({ shift: true });
    expect(next).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
  });

  it('삭제 확인창에서는 화살표로 사진을 바꾸지 않고 Escape로 확인창만 닫는다', async () => {
    const user = userEvent.setup();
    renderPhotoListPage();
    await user.click(await findFirstPhoto());
    await user.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '삭제' }));

    await user.keyboard('{ArrowRight}');
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('1 / 3');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '사진 원본 보기' })).toBeInTheDocument();
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

  it('201장 선택 시 다운로드만 비활성화하고 200장으로 줄이면 다시 활성화한다', async () => {
    vi.mocked(getPlacePhotos).mockResolvedValue(
      page(Array.from({ length: 201 }, (_, index) => photo(index + 1))),
    );
    const user = userEvent.setup();
    renderPhotoListPage();
    await findFirstPhoto();
    await user.click(screen.getByRole('button', { name: '선택' }));
    await user.click(screen.getByRole('button', { name: '전체 선택' }));

    const download = screen.getByRole('button', { name: /다운로드/ });
    expect(download).toBeDisabled();
    expect(download).toHaveAccessibleDescription(
      '한 번에 200장까지 받을 수 있어요. 선택한 사진 수를 줄여주세요.',
    );
    expect(screen.getByRole('button', { name: /삭제/ })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('한 번에 200장까지 받을 수 있어요.');
    await user.click(download);
    expect(issueBulkPhotoDownloadUrl).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '1번째 사진 선택 해제' }));
    expect(download).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('다운로드 중에는 중복 요청과 선택 변경을 막고 완료 후 다시 활성화한다', async () => {
    let finish!: (value: { downloadUrl: string; fileName: string }) => void;
    vi.mocked(issueBulkPhotoDownloadUrl).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    renderPhotoListPage();
    await findFirstPhoto();
    await user.click(screen.getByRole('button', { name: '선택' }));
    await user.click(screen.getByRole('button', { name: '전체 선택' }));
    await user.click(screen.getByRole('button', { name: '다운로드' }));

    const downloading = screen.getByRole('button', { name: '다운로드 중…' });
    expect(downloading).toBeDisabled();
    expect(downloading).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '전체 해제' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '1번째 사진 선택 해제' })).toBeDisabled();
    await user.click(downloading);
    expect(issueBulkPhotoDownloadUrl).toHaveBeenCalledTimes(1);

    await act(async () =>
      finish({ downloadUrl: 'https://cdn.test/photos.zip', fileName: 'photos.zip' }),
    );
    expect(await screen.findByRole('button', { name: '다운로드' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '취소' })).toBeEnabled();
    expect(screen.getByRole('heading', { name: '3장 선택됨' })).toBeInTheDocument();
  });

  it('삭제 중에는 확인창을 유지하고 실패해도 선택한 사진으로 다시 시도할 수 있다', async () => {
    let fail!: (error: Error) => void;
    vi.mocked(deletePhotos)
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            fail = reject;
          }),
      )
      .mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderPhotoListPage();
    await findFirstPhoto();
    await user.click(screen.getByRole('button', { name: '선택' }));
    await user.click(screen.getByRole('button', { name: '전체 선택' }));
    const toolbar = screen.getByRole('toolbar', { name: '선택한 사진 작업' });
    await user.click(within(toolbar).getByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: '삭제하기' }));

    const deleting = within(dialog).getByRole('button', { name: '삭제 중…' });
    expect(deleting).toBeDisabled();
    expect(deleting).toHaveAttribute('aria-busy', 'true');
    expect(within(dialog).getByRole('button', { name: '취소' })).toBeDisabled();
    expect(within(toolbar).getByRole('button', { name: '다운로드' })).toBeDisabled();
    expect(within(toolbar).getByRole('button', { name: '삭제 중…' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(deletePhotos).toHaveBeenCalledTimes(1);

    await act(async () => fail(new Error('failed')));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: '3장 선택됨' })).toBeInTheDocument();
    await user.click(within(toolbar).getByRole('button', { name: '삭제' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: '삭제하기' }),
    );
    await waitFor(() => expect(deletePhotos).toHaveBeenCalledTimes(2));
    expect(deletePhotos).toHaveBeenLastCalledWith([1, 2, 3], 'csrf-token');
    await waitFor(() => expect(screen.queryByRole('toolbar')).not.toBeInTheDocument());
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
