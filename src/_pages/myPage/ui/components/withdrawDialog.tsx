import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';

export function WithdrawDialog({
  open,
  isWithdrawing,
  onClose,
  onConfirm,
}: {
  open: boolean;
  isWithdrawing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      destructive
      open={open}
      onClose={onClose}
      title="정말 탈퇴하시겠어요?"
      description={
        <>
          탈퇴하면 모든 여행과 사진이 삭제되며
          <br />
          다시 복구할 수 없어요.
        </>
      }
    >
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={isWithdrawing} className="w-full">
          취소
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          isLoading={isWithdrawing}
          className="w-full"
        >
          탈퇴하기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
