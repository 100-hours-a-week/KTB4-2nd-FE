import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SearchField } from './searchField';

function Example({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState('제주');
  return (
    <SearchField
      label="여행지 검색"
      value={value}
      onValueChange={setValue}
      disabled={disabled}
      error="검색어를 확인해주세요."
      aria-describedby="external"
    />
  );
}

describe('SearchField', () => {
  it('지우기 후 입력을 비우고 포커스를 입력창으로 돌린다', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const input = screen.getByRole('searchbox', { name: '여행지 검색' });
    expect(input).toHaveValue('제주');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('검색어를 확인해주세요.');
    expect(input.getAttribute('aria-describedby')).toContain('external');
    await user.click(screen.getByRole('button', { name: '검색어 지우기' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: '검색어 지우기' })).not.toBeInTheDocument();
    await user.type(input, '서울');
    expect(input).toHaveValue('서울');
  });

  it('비활성 상태에서는 입력과 지우기를 제공하지 않는다', () => {
    render(<Example disabled />);
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.queryByRole('button', { name: '검색어 지우기' })).not.toBeInTheDocument();
  });
});
