import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  usePhotoOriginalQuery: () => ({ data: undefined, isError: false }),
}));
const photos: UnclassifiedPhoto[] = [1, 2, 3].map((id) => ({
  id,
  thumbnailUrl: null,
  accent: 'coast',
  restoreTripPlaceId: id * 10,
}));

function page(items: UnclassifiedPhoto[], nextCursor: string | null = null) {
  return { photos: items, totalCount: 3, hasNext: nextCursor !== null, nextCursor };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <UnclassifiedPhotoListPage tripId={7} tripName="제주도 가을 여행" issue="BLURRY" />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe('UnclassifiedPhotoListPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it('상세보기 메뉴에서 현재 사진만 해제하고 뷰어를 닫는다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: '2번째 사진 상세보기' }));
    await user.click(screen.getByRole('button', { name: '사진 더보기 메뉴' }));
    expect(screen.queryByRole('menuitem', { name: '원본 다운로드' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: '해제' }));
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

  it('첫 페이지부터 표시하고 다음 페이지는 스크롤 또는 더보기 요청으로 불러온다', async () => {
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page(photos.slice(0, 2), 'next'))
      .mockResolvedValueOnce(page(photos.slice(2)));
    renderPage();
    expect(await screen.findByText('제주도 가을 여행 · 사진 2장 불러옴')).toBeInTheDocument();
    expect(getUnclassifiedPhotos).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: '사진 더 불러오기' }));
    expect(await screen.findByText('제주도 가을 여행 · 사진 3장')).toBeInTheDocument();
    expect(getUnclassifiedPhotos).toHaveBeenLastCalledWith(
      7,
      'BLURRY',
      'next',
      expect.any(AbortSignal),
    );
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
  it('다음 페이지 로딩 중 기존 사진과 스켈레톤을 유지하고 복원 장소 정보도 보존한다', async () => {
    let finish!: (value: ReturnType<typeof page>) => void;
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    renderPage();
    await screen.findByRole('button', { name: '1번째 사진 상세보기' });
    await userEvent.click(screen.getByRole('button', { name: '사진 더 불러오기' }));
    expect(screen.getByRole('button', { name: '1번째 사진 상세보기' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '사진 추가 로딩 중' })).toBeInTheDocument();
    await act(async () => finish(page([photos[1]])));
    expect(await screen.findByRole('button', { name: '2번째 사진 상세보기' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    await userEvent.click(
      within(screen.getByRole('toolbar')).getByRole('button', { name: '해제' }),
    );
    await waitFor(() =>
      expect(restoreAttachments).toHaveBeenCalledWith(
        [
          { tripAttachmentId: 1, tripPlaceId: 10 },
          { tripAttachmentId: 2, tripPlaceId: 20 },
        ],
        'csrf-token',
      ),
    );
  });

  it('추가 조회 실패 시 기존 사진을 유지하고 재시도한다', async () => {
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce(page([photos[1]]));
    renderPage();
    await screen.findByRole('button', { name: '1번째 사진 상세보기' });
    await userEvent.click(screen.getByRole('button', { name: '사진 더 불러오기' }));
    expect(await screen.findByText(/이미 불러온 사진은 볼 수 있어요/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1번째 사진 상세보기' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '사진 추가 로딩 다시 시도' }));
    expect(await screen.findByRole('button', { name: '2번째 사진 상세보기' })).toBeInTheDocument();
  });

  it('전체 선택은 남은 페이지가 모두 도착했을 때 한 번에 반영한다', async () => {
    let finishMiddle!: (value: ReturnType<typeof page>) => void;
    let finish!: (value: ReturnType<typeof page>) => void;
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishMiddle = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    expect(screen.getByRole('region', { name: '전체 선택 진행 안내' })).toHaveTextContent(
      '전체 선택 중',
    );
    expect(screen.getByRole('heading', { name: '0장 선택됨' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1번째 사진 선택' })).toBeDisabled();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    await act(async () => finishMiddle(page([photos[1]], 'last')));
    expect(screen.getByRole('heading', { name: '0장 선택됨' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('region', { name: '전체 선택 진행 안내' })).toHaveTextContent(
        '사진 2장 불러왔어요',
      ),
    );
    expect(screen.getByRole('button', { name: '2번째 사진 선택' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: '전체 선택' })).toBeDisabled();
    await act(async () => finish(page([photos[2]])));
    expect(await screen.findByRole('heading', { name: '3장 선택됨' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체 해제' })).toBeInTheDocument();
    for (const button of screen.getAllByRole('button', { name: /번째 사진 선택 해제/ })) {
      expect(button).toHaveAttribute('aria-pressed', 'true');
    }
    expect(screen.queryByRole('region', { name: '전체 선택 진행 안내' })).not.toBeInTheDocument();
  });

  it('전체 선택을 취소하면 요청을 중단하고 기존 선택을 유지한다', async () => {
    let signal: AbortSignal | undefined;
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockImplementationOnce(
        (_trip, _issue, _cursor, requestSignal) =>
          new Promise((_resolve, reject) => {
            signal = requestSignal;
            signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
          }),
      );
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    await userEvent.click(screen.getByRole('button', { name: '불러오기 취소' }));
    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole('heading', { name: '1장 선택됨' })).toBeInTheDocument();
  });

  it('전체 선택 실패 시 일부만 선택하지 않고 기존 선택을 유지한다', async () => {
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'second'))
      .mockResolvedValueOnce(page([photos[1]], 'third'))
      .mockRejectedValueOnce(new Error('failed'));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: '전체 선택 진행 안내' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: '1장 선택됨' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2번째 사진 선택' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('상세보기 끝에서 다음 페이지를 조회하고 총개수를 확정하지 않는다', async () => {
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockResolvedValueOnce(page([photos[1]]));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '1번째 사진 상세보기' }));
    const viewer = screen.getByRole('dialog');
    expect(within(viewer).getByLabelText('사진 순서')).toHaveTextContent('1 / 1+');
    expect(within(viewer).getByRole('button', { name: '이전 사진' })).toBeDisabled();
    await userEvent.click(within(viewer).getByRole('button', { name: '다음 사진' }));
    await waitFor(() =>
      expect(within(viewer).getByLabelText('사진 순서')).toHaveTextContent('2 / 2'),
    );
  });

  it('상세보기를 닫은 뒤 도착한 다음 페이지로 뷰어를 다시 열지 않는다', async () => {
    let finish!: (value: ReturnType<typeof page>) => void;
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '1번째 사진 상세보기' }));
    await userEvent.click(screen.getByRole('button', { name: '다음 사진' }));
    await userEvent.keyboard('{Escape}');
    await act(async () => finish(page([photos[1]])));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '2번째 사진 상세보기' })).toBeInTheDocument();
  });

  it('중복 사진과 반복 커서는 중복 표시하거나 무한 조회하지 않는다', async () => {
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockResolvedValueOnce(page([photos[0], photos[1]], 'next'));
    renderPage();
    await screen.findByRole('button', { name: '1번째 사진 상세보기' });
    await userEvent.click(screen.getByRole('button', { name: '사진 더 불러오기' }));
    expect(await screen.findByText(/이미 불러온 사진은 볼 수 있어요/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /번째 사진 상세보기/ })).toHaveLength(2);
    expect(getUnclassifiedPhotos).toHaveBeenCalledTimes(2);
  });

  it('내부 스크롤 영역을 관찰하고 동시에 도착한 이벤트를 하나의 요청으로 합친다', async () => {
    let observerCallback!: IntersectionObserverCallback;
    let observerOptions: IntersectionObserverInit | undefined;
    let finish!: (value: ReturnType<typeof page>) => void;
    class Observer {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observerCallback = callback;
        observerOptions = options;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('IntersectionObserver', Observer);
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const view = renderPage();
    view.container.style.overflowY = 'auto';
    await screen.findByRole('button', { name: '1번째 사진 상세보기' });
    expect(observerOptions?.root).toBe(view.container);
    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(getUnclassifiedPhotos).toHaveBeenCalledTimes(2);
    await act(async () => finish(page([photos[1]])));
  });
  it('미분류 종류를 바꾸면 이전 전체 선택 요청을 취소하고 선택 상태를 초기화한다', async () => {
    let signal: AbortSignal | undefined;
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockImplementationOnce(
        (_trip, _issue, _cursor, requestSignal) =>
          new Promise((_resolve, reject) => {
            signal = requestSignal;
            signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
          }),
      )
      .mockResolvedValueOnce(page([photos[2]]));
    const view = renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    view.rerender(
      <QueryClientProvider client={view.queryClient}>
        <UnclassifiedPhotoListPage tripId={7} tripName="제주도 가을 여행" issue="DUPLICATED" />
      </QueryClientProvider>,
    );
    expect(signal?.aborted).toBe(true);
    expect(await screen.findByRole('heading', { name: '중복 사진' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '1번째 사진 상세보기' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '전체 선택 진행 안내' })).not.toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('빈 페이지여도 다음 페이지가 있으면 빈 폴더로 단정하지 않는다', async () => {
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([], 'next'))
      .mockResolvedValueOnce(page([photos[0]]));
    renderPage();
    expect(await screen.findByRole('button', { name: '사진 더 불러오기' })).toBeInTheDocument();
    expect(screen.queryByText('폴더에 사진이 없어요')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '사진 더 불러오기' }));
    expect(await screen.findByRole('button', { name: '1번째 사진 상세보기' })).toBeInTheDocument();
  });
  it('복원 성공 후 처리한 사진을 숨기고 다음 목록이 올 때까지 정리 완료로 표시하지 않는다', async () => {
    let finish!: (value: ReturnType<typeof page>) => void;
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]], 'next'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await userEvent.click(
      within(screen.getByRole('toolbar')).getByRole('button', { name: '해제' }),
    );
    expect(await screen.findByText('남은 사진을 확인하고 있어요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1번째 사진 선택 해제' })).not.toBeInTheDocument();
    expect(screen.queryByText('확인할 사진을 모두 정리했어요.')).not.toBeInTheDocument();
    await act(async () => finish(page([photos[1]])));
    expect(await screen.findByRole('button', { name: '1번째 사진 상세보기' })).toBeInTheDocument();
    expect(screen.queryByText('폴더에 사진이 없어요')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await userEvent.click(
      within(screen.getByRole('toolbar')).getByRole('button', { name: '해제' }),
    );
    await waitFor(() =>
      expect(restoreAttachment).toHaveBeenLastCalledWith(
        { tripAttachmentId: 2, tripPlaceId: 20 },
        'csrf-token',
      ),
    );
  });

  it('마지막 사진 삭제 후 남은 사진이 없다는 응답이 온 뒤에만 빈 상태를 표시한다', async () => {
    let finish!: (value: ReturnType<typeof page>) => void;
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]]))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    await userEvent.click(
      within(screen.getByRole('toolbar')).getByRole('button', { name: '삭제' }),
    );
    const dialog = screen.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' });
    expect(within(dialog).getByText('삭제 후에는 되돌릴 수 없습니다.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제하기' }));
    await waitFor(() => expect(getUnclassifiedPhotos).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('폴더에 사진이 없어요')).not.toBeInTheDocument();
    await act(async () => finish(page([])));
    expect(await screen.findByText('확인할 사진을 모두 정리했어요.')).toBeInTheDocument();
  });

  it('처리 후 재조회가 실패하면 완료 대신 다시 확인 안내를 표시한다', async () => {
    vi.mocked(getUnclassifiedPhotos)
      .mockResolvedValueOnce(page([photos[0]]))
      .mockRejectedValueOnce(new Error('refresh failed'))
      .mockResolvedValueOnce(page([photos[1]]));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '선택' }));
    await userEvent.click(screen.getByRole('button', { name: '전체 선택' }));
    await userEvent.click(
      within(screen.getByRole('toolbar')).getByRole('button', { name: '해제' }),
    );
    expect(await screen.findByText('남은 사진을 확인하지 못했어요.')).toBeInTheDocument();
    expect(screen.queryByText('확인할 사진을 모두 정리했어요.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다시 확인' }));
    expect(await screen.findByRole('button', { name: '1번째 사진 상세보기' })).toBeInTheDocument();
  });
});
