import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { previewTrips } from '../model/previewTrips';
import { TripListPage } from './tripListPage';

describe('TripListPage', () => {
  it('여행 수와 여행 카드 정보를 표시한다', () => {
    render(<TripListPage initialTrips={previewTrips} />);

    expect(screen.getByRole('heading', { name: '나의 여행 목록' })).toBeInTheDocument();
    expect(screen.getByText(/지금까지/).parentElement).toHaveTextContent(
      '5개의 여행을 기록했어요.',
    );
    expect(screen.getByRole('heading', { name: '파리 & 런던' })).toBeInTheDocument();
    expect(screen.getByText('여담이 사진을 정리하고 있어요')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '목록' })).toHaveAttribute('aria-current', 'page');
  });

  it('즐겨찾기만 보기를 켜면 즐겨찾기한 여행만 표시한다', async () => {
    render(<TripListPage initialTrips={previewTrips} />);

    await userEvent.click(screen.getByRole('switch', { name: '즐겨찾기만 보기' }));

    expect(screen.getByRole('heading', { name: '파리 & 런던' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '이천 가을 여행' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '제주 한 바퀴' })).not.toBeInTheDocument();
  });

  it('정렬 기준을 오래된순으로 바꿀 수 있다', async () => {
    render(<TripListPage initialTrips={previewTrips} />);

    await userEvent.click(screen.getByRole('combobox', { name: '여행 정렬' }));
    await userEvent.click(screen.getByRole('option', { name: '오래된순' }));

    const allTrips = screen.getByRole('region', { name: '전체 여행' });
    const tripHeadings = within(allTrips).getAllByRole('heading', { level: 3 });
    expect(tripHeadings[0]).toHaveTextContent('서울 주말 산책');
  });

  it('여행이 없으면 첫 여행 만들기 안내를 표시한다', () => {
    render(<TripListPage initialTrips={[]} />);

    expect(screen.getByText('아직 기록된 여행이 없어요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /첫 여행 만들기/ })).toHaveAttribute(
      'href',
      '/trips/create?step=name',
    );
  });

  it('불러오기에 실패하면 스켈레톤과 다시 시도 동작을 제공한다', async () => {
    const onRetry = vi.fn();
    render(<TripListPage initialTrips={[]} viewState="error" onRetry={onRetry} />);

    expect(screen.getByRole('status', { name: '여행 목록 불러오는 중' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('여행을 가져오지 못했어요.');

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
