import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PageHeader } from './pageHeader';

describe('PageHeader', () => {
  it('뒤로가기 링크와 제목, 우측 액션을 공통 배치한다', () => {
    render(
      <PageHeader
        title="제주 여행"
        backHref="/trips"
        backLabel="여행 목록으로 돌아가기"
        action={<button type="button">더보기</button>}
      />,
    );

    expect(screen.getByRole('link', { name: '여행 목록으로 돌아가기' })).toHaveAttribute(
      'href',
      '/trips',
    );
    expect(screen.getByRole('heading', { name: '제주 여행' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '더보기' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveClass('sticky', 'top-0');
  });

  it('뒤로가기 버튼의 실행과 비활성 상태를 처리한다', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const { rerender } = render(
      <PageHeader backLabel="이전 단계로 이동" onBack={onBack} backDisabled />,
    );

    expect(screen.getByRole('button', { name: '이전 단계로 이동' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '이전 단계로 이동' }));
    expect(onBack).not.toHaveBeenCalled();

    rerender(<PageHeader backLabel="이전 단계로 이동" onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: '이전 단계로 이동' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
