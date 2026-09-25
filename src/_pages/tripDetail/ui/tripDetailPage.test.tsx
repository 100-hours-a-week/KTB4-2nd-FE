import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createPreviewTripDetail } from '../model/previewTripDetail';
import { TripDetailPage } from './tripDetailPage';

const trip = createPreviewTripDetail(7);

describe('TripDetailPage', () => {
  it('여행 정보와 장소 폴더를 표시한다', () => {
    render(<TripDetailPage trip={trip} />);

    expect(screen.getByRole('heading', { level: 1, name: '제주도 가을 여행' })).toBeInTheDocument();
    expect(screen.getByText('서귀포시 외 2개')).toBeInTheDocument();
    expect(screen.getByText('사진 128장')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '장소 6' })).toBeInTheDocument();
    expect(screen.getByText('가나다순')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /서귀포/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /확인 필요/ })).toBeInTheDocument();
  });

  it('공유 메뉴에서 이메일과 권한 목록을 표시하고 이메일을 추가한다', async () => {
    const user = userEvent.setup();
    render(<TripDetailPage trip={trip} />);

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '링크로 공유하기' }));

    expect(
      screen.getByRole('dialog', { name: '공유할 이메일을 입력해주세요' }),
    ).toBeInTheDocument();
    expect(screen.getByText('alice5855@gmail.com')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: '공유할 이메일' }), 'new@example.com');
    await user.click(screen.getByRole('button', { name: '추가하기' }));

    expect(screen.getByText('new@example.com')).toBeInTheDocument();
    expect(screen.getByText('공유할 사람 4')).toBeInTheDocument();
  });

  it('더보기 메뉴에서 여행 삭제를 누르면 확인 창을 표시한다', async () => {
    const user = userEvent.setup();
    render(<TripDetailPage trip={trip} />);

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '여행 삭제' }));

    expect(screen.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })).toBeInTheDocument();
    expect(screen.getByText(/사진 128장이 삭제되며/)).toBeInTheDocument();
  });

  it('삭제 확인 시 전달받은 삭제 함수를 호출한다', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TripDetailPage trip={trip} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: '여행 더보기 메뉴' }));
    await user.click(screen.getByRole('menuitem', { name: '여행 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제하기' }));

    expect(onDelete).toHaveBeenCalledWith(7);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('사진 로드 실패 상태와 다시 시도 동작을 표시한다', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<TripDetailPage trip={trip} viewState="error" onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('사진 로드에 실패했어요.');
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
