import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Funnel } from './funnel';

describe('Funnel', () => {
  it('현재 단계와 이름이 같은 화면만 보여준다', () => {
    render(
      <Funnel step="date">
        <Funnel.Step name="name">이름 입력</Funnel.Step>
        <Funnel.Step name="date">기간 입력</Funnel.Step>
      </Funnel>,
    );

    expect(screen.getByText('기간 입력')).toBeInTheDocument();
    expect(screen.queryByText('이름 입력')).not.toBeInTheDocument();
  });
});
