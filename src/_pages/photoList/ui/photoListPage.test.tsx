import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPreviewPhotos } from '../model/previewPhotos';
import { PhotoListPage } from './photoListPage';

function renderPage(photoCount = 6) {
  return render(
    <PhotoListPage
      tripId={7}
      tripName="제주도 가을 여행"
      placeName="제주시"
      initialPhotos={createPreviewPhotos(photoCount)}
    />,
  );
}

describe('PhotoListPage', () => {
  afterEach(() => vi.useRealTimers());

  it('장소명과 사진 목록을 표시한다', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: '제주시' })).toBeInTheDocument();
    expect(screen.getByText('제주도 가을 여행 · 사진 6장')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /번째 사진 보기/ })).toHaveLength(6);
  });

  it('선택 모드에서 사진 선택과 전체 선택을 제공한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '선택' }));
    const actionBar = screen.getByRole('toolbar', { name: '선택한 사진 작업' });
    expect(actionBar.parentElement).toBe(document.body);

    await user.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    expect(screen.getByRole('heading', { name: '1장 선택됨' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전체 선택' }));
    expect(screen.getByRole('heading', { name: '6장 선택됨' })).toBeInTheDocument();
  });

  it('사진을 길게 누르면 선택 모드로 전환하고 누른 사진을 선택한다', () => {
    vi.useFakeTimers();
    renderPage();
    const photo = screen.getByRole('button', { name: '1번째 사진 보기' });

    fireEvent.pointerDown(photo, { pointerId: 1, pointerType: 'touch', button: 0 });
    act(() => vi.advanceTimersByTime(600));
    fireEvent.pointerUp(photo, { pointerId: 1, pointerType: 'touch', button: 0 });
    fireEvent.click(photo);

    expect(screen.getByRole('heading', { name: '1장 선택됨' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1번째 사진 선택 해제' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('dialog', { name: '사진 원본 보기' })).not.toBeInTheDocument();
  });

  it('선택한 사진을 확인 후 화면에서 삭제한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '선택' }));
    await user.click(screen.getByRole('button', { name: '1번째 사진 선택' }));
    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(
      screen.getByRole('alertdialog', { name: '사진을 삭제하시겠습니까?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '삭제하기' }));
    expect(screen.getByText('제주도 가을 여행 · 사진 5장')).toBeInTheDocument();
  });

  it('사진을 누르면 원본 보기와 앞뒤 이동 버튼을 표시한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '1번째 사진 보기' }));

    expect(screen.getByRole('dialog', { name: '사진 원본 보기' })).toBeInTheDocument();
    expect(screen.getByLabelText('사진 순서')).toHaveTextContent('1 / 6');
    expect(screen.getByRole('button', { name: '이전 사진' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 사진' })).toBeInTheDocument();
  });

  it('사진이 없으면 빈 폴더 안내를 표시한다', () => {
    renderPage(0);

    expect(screen.getByText('폴더에 사진이 없어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /사진 추가/ })).toBeInTheDocument();
  });
});
