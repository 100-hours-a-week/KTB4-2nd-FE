import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';

export function StoryCancelDialog({
  open,
  canCancel = true,
  isCanceling,
  onConfirm,
  onClose,
}: {
  open: boolean;
  canCancel?: boolean;
  isCanceling: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="스토리 생성을 취소할까요?"
      description="지금 취소하면 폴더 선택 화면으로 돌아가요."
    >
      <DialogActions>
        <Button
          variant="secondary"
          disabled={!canCancel || isCanceling}
          onClick={onConfirm}
          className="w-full min-h-11 px-0 text-sm"
        >
          취소하기
        </Button>
        <Button onClick={onClose} className="w-full min-h-11 px-0 text-sm">
          이어서 만들기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
