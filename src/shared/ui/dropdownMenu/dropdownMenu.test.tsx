import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DropdownMenu } from './dropdownMenu';

function createItems() {
  return [
    { id: 'edit', label: '수정하기', onSelect: vi.fn() },
    { id: 'share', label: '공유하기', onSelect: vi.fn(), disabled: true },
    {
      id: 'delete',
      label: '삭제하기',
      onSelect: vi.fn(),
      destructive: true,
      dividerBefore: true,
    },
  ];
}

describe('DropdownMenu', () => {
  it('트리거를 눌러 열고 항목을 선택하면 닫힌다', async () => {
    const user = userEvent.setup();
    const items = createItems();
    render(<DropdownMenu items={items} />);

    const trigger = screen.getByRole('button', { name: '메뉴 열기' });
    await user.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: '수정하기' }));

    expect(items[0].onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('바깥을 누르면 닫힌다', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DropdownMenu items={createItems()} />
        <button type="button">바깥</button>
      </div>,
    );

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
    await user.click(screen.getByRole('button', { name: '바깥' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('키보드로 열고 이동하며 Esc로 닫는다', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu items={createItems()} />);

    const trigger = screen.getByRole('button', { name: '메뉴 열기' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: '수정하기' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: '삭제하기' })).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('비활성화 항목은 선택할 수 없다', async () => {
    const user = userEvent.setup();
    const items = createItems();
    render(<DropdownMenu items={items} />);

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
    const disabledItem = screen.getByRole('menuitem', { name: '공유하기' });

    expect(disabledItem).toBeDisabled();
    await user.click(disabledItem);
    expect(items[1].onSelect).not.toHaveBeenCalled();
  });
});
