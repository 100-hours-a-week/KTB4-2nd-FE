import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePage } from './homePage';

describe('HomePage', () => {
  it('서비스 이름을 표시한다', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { level: 1, name: '여담' })).toBeInTheDocument();
  });
});
