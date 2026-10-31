import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from './dialog';

function Example({ onClose, disabled = false }: { onClose: () => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>열기</Button>
      <Dialog
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="여행 삭제"
        description="삭제 후에는 되돌릴 수 없습니다."
        destructive
      >
        <DialogActions>
          <Button disabled={disabled} onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button disabled={disabled} variant="destructive">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('이름·설명을 연결하고 Tab과 Shift+Tab으로 액션 사이 포커스를 순환한다', async () => {
    const user = userEvent.setup();
    render(<Example onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '열기' }));
    const dialog = screen.getByRole('alertdialog', { name: '여행 삭제' });
    expect(dialog).toHaveAccessibleDescription('삭제 후에는 되돌릴 수 없습니다.');
    const cancel = screen.getByRole('button', { name: '취소' });
    const confirm = screen.getByRole('button', { name: '삭제' });
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
  });

  it('Escape로 닫고 열기 버튼에 포커스와 기존 body 스크롤 설정을 복구한다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    try {
      render(<Example onClose={onClose} />);
      const trigger = screen.getByRole('button', { name: '열기' });
      await user.click(trigger);
      expect(document.body.style.overflow).toBe('hidden');
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledOnce();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(document.body.style.overflow).toBe('auto');
    } finally {
      document.body.style.overflow = previousOverflow;
    }
  });

  it('배경 클릭으로 닫고 패널 내부 클릭은 닫기로 처리하지 않는다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Example onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: '열기' }));
    const panel = screen.getByRole('alertdialog');
    await user.click(screen.getByText('삭제 후에는 되돌릴 수 없습니다.'));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(panel.previousElementSibling as HTMLElement);
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('모든 액션이 비활성일 때 패널에 포커스를 유지하며 Escape로 닫는다', async () => {
    const user = userEvent.setup();
    render(<Example disabled onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '열기' }));
    const panel = screen.getByRole('alertdialog');
    expect(panel).toHaveFocus();
    await user.tab();
    expect(panel).toHaveFocus();
    await user.tab({ shift: true });
    expect(panel).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
