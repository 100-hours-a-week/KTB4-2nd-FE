import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SignupPage } from './signupPage';

vi.mock('@/features/completeSignup', () => ({
  NicknameForm: () => (
    <form>
      <input aria-label="닉네임" />
      <button type="submit">확인</button>
    </form>
  ),
}));

describe('SignupPage', () => {
  it('브라우저 전체 높이 대신 앱 프레임 높이를 사용한다', () => {
    render(<SignupPage />);

    expect(screen.getByRole('main')).toHaveClass('h-full', 'min-h-0');
    expect(screen.getByRole('main')).not.toHaveClass('min-h-dvh');
  });

  it('키보드로 공간이 부족해지면 화면 내부에서 입력과 확인 버튼에 접근할 수 있다', () => {
    render(<SignupPage />);

    expect(screen.getByRole('main')).toHaveClass('overflow-y-auto', 'overscroll-contain');
    expect(screen.getByRole('textbox', { name: '닉네임' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
  });
});
