import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BottomNavigation, type BottomNavigationItem } from './bottomNavigation';

const items: BottomNavigationItem[] = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'list', label: '목록', icon: 'list' },
  { id: 'create', label: '새 기록 추가', icon: 'plus', action: true },
  { id: 'search', label: '검색', icon: 'search', disabled: true },
];

describe('BottomNavigation', () => {
  it('현재 탭을 표시하고 다른 탭을 선택할 수 있다', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BottomNavigation items={items} activeId="home" onSelect={onSelect} />);

    expect(screen.getByRole('navigation', { name: '하단 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '홈' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '목록' }));
    expect(onSelect).toHaveBeenCalledWith('list');
  });

  it('비활성 탭은 선택할 수 없다', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BottomNavigation items={items} activeId="home" onSelect={onSelect} />);

    const search = screen.getByRole('button', { name: '검색' });
    expect(search).toBeDisabled();
    await user.click(search);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('가운데 추가 버튼은 탭 선택 상태를 사용하지 않는다', () => {
    render(<BottomNavigation items={items} activeId="home" />);

    expect(screen.getByRole('button', { name: '새 기록 추가' })).not.toHaveAttribute(
      'aria-pressed',
    );
  });

  it('주소가 있는 탭은 현재 페이지를 표시하는 링크가 된다', () => {
    render(
      <BottomNavigation
        items={[{ id: 'home', label: '홈', icon: 'home', href: '/' }]}
        activeId="home"
      />,
    );

    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page');
  });
});
