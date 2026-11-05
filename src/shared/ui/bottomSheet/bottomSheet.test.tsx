import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BottomSheet } from './bottomSheet';

function renderSheet(onClose = vi.fn()) {
  render(
    <>
      <button type="button">바깥 버튼</button>
      <BottomSheet open onClose={onClose} title="비슷한 사진으로 바꾸기" description="설명">
        <button type="button">첫 번째</button>
        <button type="button">두 번째</button>
      </BottomSheet>
    </>,
  );
  return onClose;
}

describe('BottomSheet', () => {
  it('제목과 설명이 붙은 모달로 열리고 첫 버튼에 포커스한다', () => {
    renderSheet();
    const sheet = screen.getByRole('dialog', { name: '비슷한 사진으로 바꾸기' });
    expect(sheet).toHaveAttribute('aria-modal', 'true');
    expect(sheet).toHaveAccessibleDescription('설명');
    expect(screen.getByRole('button', { name: '첫 번째' })).toHaveFocus();
  });

  it('Tab은 시트 안에서만 돌고, Escape로 닫는다', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet();

    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: '첫 번째' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
