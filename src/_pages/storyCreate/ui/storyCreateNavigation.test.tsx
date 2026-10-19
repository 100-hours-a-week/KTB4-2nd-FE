import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSyncExternalStore } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TripDetailPage } from '@/_pages/tripDetail';
import { TripStoryPage } from '@/_pages/tripStory/ui/tripStoryPage';
import { cancelStoryGeneration } from '@/features/createStory/api/cancelStoryGeneration';
import { getStoryGenerationStatus } from '@/features/createStory/api/getStoryGenerationStatus';
import type { TripDetail } from '@/features/tripDetail';

import { StoryCreatePage } from './storyCreatePage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (href: string) => {
      window.history.pushState(null, '', href);
      window.dispatchEvent(new Event('test:navigation'));
    },
    replace: (href: string) => {
      window.history.replaceState(null, '', href);
      window.dispatchEvent(new Event('test:navigation'));
    },
    back: () => window.history.back(),
  }),
}));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('@/features/aiStatus/api/getAiStatus', () => ({
  getAiStatus: vi.fn().mockResolvedValue({ running: true, ready: true }),
}));
vi.mock('@/features/tripDetail/api/getTripPlaceFolders', () => ({
  getTripPlaceFolders: vi.fn().mockResolvedValue({ folders: [], hasNext: false, nextCursor: null }),
}));
vi.mock('@/features/createStory/api/getStorySourceFolders', () => ({
  getStorySourceFolders: vi.fn().mockResolvedValue({
    folders: [{ id: 1, name: '제주', photoCount: 3, thumbnailUrl: null, accent: 'coast' }],
    hasNext: false,
    nextCursor: null,
  }),
}));
vi.mock('@/features/createStory/api/createStoryGeneration', () => ({
  createStoryGeneration: vi.fn().mockResolvedValue({
    generationId: 31,
    tripId: 7,
    status: 'QUEUED',
  }),
}));
vi.mock('@/features/createStory/api/getStoryGenerationStatus', () => ({
  getStoryGenerationStatus: vi.fn(),
}));
vi.mock('@/features/createStory/api/cancelStoryGeneration', () => ({
  cancelStoryGeneration: vi.fn().mockResolvedValue(undefined),
}));

const trip: TripDetail = {
  id: 7,
  name: '제주 여행',
  locations: ['제주'],
  startDate: '2026-10-12',
  endDate: '2026-10-14',
  nights: 2,
  photoCount: 3,
  reviewCount: 0,
  hasStory: false,
};
const clients: QueryClient[] = [];

function subscribeNavigation(listener: () => void) {
  window.addEventListener('test:navigation', listener);
  window.addEventListener('popstate', listener);
  return () => {
    window.removeEventListener('test:navigation', listener);
    window.removeEventListener('popstate', listener);
  };
}

// 실제 페이지들의 헤더와 브라우저 방문 기록을 함께 실행한다.
function NavigationHarness() {
  const pathname = useSyncExternalStore(subscribeNavigation, () => window.location.pathname);
  if (pathname === '/trips/7/story/create') return <StoryCreatePage trip={trip} />;
  if (pathname === '/trips/7/story') {
    return (
      <TripStoryPage
        story={{
          tripId: 7,
          tripName: trip.name,
          startDate: trip.startDate,
          endDate: trip.endDate,
          photoCount: 3,
          days: [],
        }}
      />
    );
  }
  if (pathname === '/trips/7') return <TripDetailPage trip={trip} />;
  return <h1>여행 목록</h1>;
}

async function enterStoryCreate() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <NavigationHarness />
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /스토리 보기/ }));
  await user.click(screen.getByRole('button', { name: '스토리 만들기' }));
  await screen.findByRole('radio', { name: /담백하게/ });
  return user;
}

async function startStory(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: /담백하게/ }));
  await user.click(screen.getByRole('button', { name: '생성' }));
  await user.click(await screen.findByRole('checkbox', { name: '제주 사진 3장 선택' }));
  await user.click(screen.getByRole('button', { name: '생성' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/trips');
  window.history.pushState(null, '', '/trips/7');
  vi.mocked(getStoryGenerationStatus).mockResolvedValue({
    generationId: 31,
    status: 'PROCESSING',
    progress: 40,
    storyId: null,
    error: null,
  });
});

afterEach(() => clients.splice(0).forEach((client) => client.clear()));

describe('스토리 생성 이후 헤더 뒤로가기', () => {
  it('분위기 선택에서 나간 뒤 여행 상세의 뒤로가기는 생성 화면 대신 목록으로 이동한다', async () => {
    const user = await enterStoryCreate();
    await user.click(screen.getByRole('button', { name: '여행 상세로 돌아가기' }));
    await user.click(await screen.findByRole('button', { name: '여행 목록으로 돌아가기' }));

    expect(await screen.findByRole('heading', { name: '여행 목록' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/trips');
  });

  it('생성 중 다른 작업을 이어한 뒤에도 상세 헤더에서 목록으로 나갈 수 있다', async () => {
    const user = await enterStoryCreate();
    await startStory(user);
    await screen.findByRole('progressbar', { name: '스토리 생성 진행률' });
    await user.click(screen.getByRole('button', { name: '다른 작업 이어하기' }));
    await user.click(await screen.findByRole('button', { name: '여행 목록으로 돌아가기' }));

    expect(await screen.findByRole('heading', { name: '여행 목록' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/trips');
    expect(
      JSON.parse(window.localStorage.getItem('story-create-draft-v1:7') ?? '{}'),
    ).toMatchObject({
      generationId: 31,
    });
    expect(cancelStoryGeneration).not.toHaveBeenCalled();
  });

  it('생성을 취소한 뒤 앨범, 분위기, 여행 상세를 거쳐 목록으로 나간다', async () => {
    const user = await enterStoryCreate();
    await startStory(user);
    await screen.findByRole('progressbar', { name: '스토리 생성 진행률' });
    await user.click(screen.getByRole('button', { name: '스토리 생성에서 돌아가기' }));
    const dialog = screen.getByRole('dialog', { name: '스토리 생성을 취소할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '취소하기' }));
    expect(await screen.findByRole('checkbox', { name: '제주 사진 3장 선택' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: '분위기 선택으로 돌아가기' }));
    await user.click(screen.getByRole('button', { name: '여행 상세로 돌아가기' }));
    await user.click(await screen.findByRole('button', { name: '여행 목록으로 돌아가기' }));

    expect(await screen.findByRole('heading', { name: '여행 목록' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/trips');
    expect(cancelStoryGeneration).toHaveBeenCalledExactlyOnceWith(31, 'csrf-token');
    expect(window.localStorage.getItem('story-create-draft-v1:7')).toBeNull();
  });

  it('생성 완료 후 스토리를 열어도 헤더 뒤로가기는 여행 상세로 이동한다', async () => {
    vi.mocked(getStoryGenerationStatus).mockResolvedValue({
      generationId: 31,
      status: 'COMPLETED',
      progress: 100,
      storyId: 5,
      error: null,
    });
    const user = await enterStoryCreate();
    await startStory(user);
    await user.click(await screen.findByRole('button', { name: '스토리 보기' }));
    await user.click(await screen.findByRole('button', { name: '여행 상세로 돌아가기' }));

    await waitFor(() => expect(window.location.pathname).toBe('/trips/7'));
    await user.click(screen.getByRole('button', { name: '여행 목록으로 돌아가기' }));
    expect(await screen.findByRole('heading', { name: '여행 목록' })).toBeInTheDocument();
  });
});
