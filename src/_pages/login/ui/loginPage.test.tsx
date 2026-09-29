import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginPage } from './loginPage';

vi.mock('@/features/kakaoLogin', () => ({
  KakaoLoginButton: () => <button type="button">카카오로 시작하기</button>,
}));

describe('LoginPage', () => {
  it('앱 프레임 높이를 사용해 별도 스크롤을 만들지 않는다', () => {
    render(<LoginPage />);

    expect(screen.getByRole('main')).toHaveClass('h-full', 'overflow-hidden');
    expect(screen.getByRole('main')).not.toHaveClass('min-h-dvh');
  });
});
