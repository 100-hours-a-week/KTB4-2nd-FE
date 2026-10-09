import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { searchTrips } from '@/features/search/api/searchTrips';
import type { SearchResult } from '@/features/search/model/types';

import { SearchPage } from './searchPage';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/features/search/api/searchTrips', () => ({ searchTrips: vi.fn() }));

const result: SearchResult = {
  query: '제주 바다',
  answer: '2026년 8월 25일 화요일이에요.',
  answerError: null,
  folders: [
    {
      tripId: 1,
      tripName: '제주도 가을 여행',
      startDate: '2026-08-24',
      endDate: '2026-08-27',
      regionNames: ['제주시'],
      photoCount: 128,
      thumbnailUrl: null,
    },
  ],
  photos: [{ id: 3, tripId: 1, tripPlaceId: 9, thumbnailUrl: null, accent: 'coast' }],
};

function renderPage(query: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <SearchPage query={query} />
    </QueryClientProvider>,
  );
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchTrips).mockResolvedValue(result);
  });

  it('검색어가 없으면 예시를 보여주고 문장부호를 정리해 검색한다', async () => {
    const user = userEvent.setup();
    renderPage('');

    expect(screen.getByText('이렇게 검색해보세요')).toBeInTheDocument();
    expect(searchTrips).not.toHaveBeenCalled();

    await user.type(screen.getByRole('searchbox', { name: '검색어' }), '빨간 옷 입은 날?{Enter}');
    expect(push).toHaveBeenCalledWith(`/search?q=${encodeURIComponent('빨간 옷 입은 날')}`);
  });

  it('두 글자 미만이면 검색하지 않고 안내한다', async () => {
    const user = userEvent.setup();
    renderPage('');

    await user.type(screen.getByRole('searchbox', { name: '검색어' }), '?!a{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('검색어를 2글자 이상 입력해주세요.');
    expect(push).not.toHaveBeenCalled();
  });

  it('AI 답변과 사진·폴더 결과를 탭으로 보여준다', async () => {
    const user = userEvent.setup();
    renderPage('제주 바다');

    expect(await screen.findByText('2026년 8월 25일 화요일이에요.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '사진 1건' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('link', { name: '1번째 사진이 있는 폴더 보기' })).toHaveAttribute(
      'href',
      '/trips/1/places/9/photos',
    );

    await user.click(screen.getByRole('tab', { name: '폴더 1건' }));
    expect(screen.getByRole('link', { name: '제주도 가을 여행 여행 상세 보기' })).toHaveAttribute(
      'href',
      '/trips/1',
    );
  });

  it('결과가 없으면 빈 상태를 보여준다', async () => {
    vi.mocked(searchTrips).mockResolvedValue({ ...result, answer: null, folders: [], photos: [] });
    renderPage('없음');

    expect(await screen.findByText('검색 결과가 없어요.')).toBeInTheDocument();
  });
});
