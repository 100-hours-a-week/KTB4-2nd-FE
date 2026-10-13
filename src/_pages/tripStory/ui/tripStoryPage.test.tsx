import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPhotoOriginal } from '@/features/photoList/api/getPhotoOriginal';
import type { TripStory } from '@/features/tripStory';
import { toast } from '@/shared/ui/toast';

import { TripStoryPage } from './tripStoryPage';

const back = vi.fn(),
  replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ back, replace }) }));
vi.mock('@/features/photoList/api/getPhotoOriginal', () => ({ getPhotoOriginal: vi.fn() }));
vi.mock('@/shared/ui/toast', () => ({ toast: { warning: vi.fn(), error: vi.fn() } }));

function story(): TripStory {
  return {
    tripId: 7,
    tripName: '제주도 가을 여행',
    startDate: '2026-10-12',
    endDate: '2026-10-14',
    photoCount: 128,
    days: [
      {
        date: '2026-10-12',
        dayNumber: 1,
        placeName: '성산일출봉',
        photos: [
          {
            id: '1',
            attachmentId: 41,
            placeName: '성산일출봉',
            situation: '일출',
            sentence: '성산일출봉 정상에서 맞이한 첫 해돋이',
            thumbnailUrl: 'https://cdn.test/41-thumb.webp',
          },
          {
            id: '2',
            attachmentId: 42,
            placeName: '흑돼지 거리',
            situation: '지역 식사',
            sentence: '흑돼지 맛집 찾아 헤맨 보람이 있었다',
            thumbnailUrl: 'https://cdn.test/42-thumb.webp',
          },
        ],
      },
      {
        date: '2026-10-13',
        dayNumber: 2,
        placeName: '서귀포',
        photos: [
          {
            id: '3',
            attachmentId: 43,
            placeName: '서귀포',
            situation: '노을 해변',
            sentence: '노을이 질 때까지 해변을 걸었다',
            thumbnailUrl: null,
          },
        ],
      },
    ],
  };
}
function renderStory(value = story()) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <TripStoryPage story={value} />
    </QueryClientProvider>,
  );
}

describe('TripStoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPhotoOriginal).mockImplementation(async (tripAttachmentId) => ({
      tripAttachmentId,
      originalUrl: `https://cdn.test/${tripAttachmentId}-original.webp`,
    }));
  });

  it('날짜별 타임라인과 캡션을 표시한다', () => {
    renderStory();
    expect(screen.getByRole('heading', { name: '여행 스토리' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '제주도 가을 여행' })).toBeInTheDocument();
    expect(screen.getByText('128장')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '1일째 성산일출봉' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '2일째 서귀포' })).toBeInTheDocument();
    expect(screen.getByText('성산일출봉 정상에서 맞이한 첫 해돋이')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '성산일출봉 정상에서 맞이한 첫 해돋이' }),
    ).toHaveAttribute('loading', 'lazy');
    expect(getPhotoOriginal).not.toHaveBeenCalled();
  });

  it('원본은 상세보기를 열 때 조회한다', async () => {
    renderStory();
    expect(getPhotoOriginal).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '성산일출봉 · 일출 사진 상세보기' }));
    const dialog = screen.getByRole('dialog', { name: '스토리 사진 상세보기' });
    await waitFor(() =>
      expect(within(dialog).getByRole('img')).toHaveAttribute(
        'src',
        'https://cdn.test/41-original.webp',
      ),
    );
    expect(getPhotoOriginal).toHaveBeenCalledWith(41);
  });

  it('사진 상세보기에서 화살표 이동, Tab 순환, Escape 종료와 포커스 복귀를 지원한다', async () => {
    const user = userEvent.setup();
    renderStory();
    const trigger = screen.getByRole('button', { name: '성산일출봉 · 일출 사진 상세보기' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: '스토리 사진 상세보기' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const close = within(dialog).getByRole('button', { name: '사진 상세보기 닫기' });
    expect(close).toHaveFocus();
    await waitFor(() =>
      expect(within(dialog).getByRole('img')).toHaveAttribute(
        'src',
        'https://cdn.test/41-original.webp',
      ),
    );
    await user.tab({ shift: true });
    expect(within(dialog).getByRole('button', { name: '다음 사진' })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('2 / 3');
    await waitFor(() =>
      expect(within(dialog).getByRole('img')).toHaveAttribute(
        'src',
        'https://cdn.test/42-original.webp',
      ),
    );
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('1 / 3');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('썸네일 로딩 실패 시 대체 UI와 토스트를 표시한다', () => {
    renderStory();
    fireEvent.error(screen.getByRole('img', { name: '성산일출봉 정상에서 맞이한 첫 해돋이' }));
    const card = screen.getByRole('button', { name: '성산일출봉 · 일출 사진 상세보기' });
    expect(within(card).getByText('사진을 불러오지 못했어요')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith('사진 로드에 실패했어요.');
  });

  it('원본 조회 실패를 안내하고 뷰어는 닫을 수 있다', async () => {
    vi.mocked(getPhotoOriginal).mockRejectedValueOnce(new Error('failed'));
    renderStory();
    await userEvent.click(screen.getByRole('button', { name: '성산일출봉 · 일출 사진 상세보기' }));
    expect(await screen.findByRole('status')).toHaveTextContent('사진을 불러오지 못했어요');
    expect(toast.error).toHaveBeenCalledExactlyOnceWith('사진 로드에 실패했어요.');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('최대 30개의 사진만 표시하고 스토리가 없으면 빈 상태를 표시한다', () => {
    const value = story();
    value.days = [value.days[0]];
    value.days[0].photos = Array.from({ length: 35 }, (_, index) => ({
      ...value.days[0].photos[0],
      id: String(index),
    }));
    const view = renderStory(value);
    expect(screen.getAllByRole('button', { name: /사진 상세보기/ })).toHaveLength(30);
    view.unmount();
    renderStory({ ...value, days: [] });
    expect(screen.getByText('아직 만들어진 스토리가 없어요.')).toBeInTheDocument();
  });

  it('편집은 미지원 안내를 표시한다', async () => {
    renderStory();
    await userEvent.click(screen.getByRole('button', { name: '스토리 편집 (준비 중)' }));
    expect(toast.warning).toHaveBeenCalledWith('아직 지원하지 않는 기능이에요.');
  });

  it('방문 기록이 없으면 여행 상세로 돌아간다', async () => {
    const history = vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    renderStory();
    await userEvent.click(screen.getByRole('button', { name: '여행 상세로 돌아가기' }));
    expect(replace).toHaveBeenCalledWith('/trips/7');
    history.mockRestore();
  });
});
