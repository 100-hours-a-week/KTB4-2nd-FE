import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';

export function PhotoDeleteDialog({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      destructive
      open={count > 0}
      onClose={onCancel}
      title={count > 1 ? `사진 ${count}장을 삭제하시겠습니까?` : '사진을 삭제하시겠습니까?'}
      description="삭제 후에는 되돌릴 수 없습니다."
    >
      <DialogActions>
        <Button variant="secondary" onClick={onCancel} className="min-h-11 w-full px-0 text-sm">
          취소
        </Button>
        <Button variant="destructive" onClick={onConfirm} className="min-h-11 w-full px-0 text-sm">
          삭제하기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
