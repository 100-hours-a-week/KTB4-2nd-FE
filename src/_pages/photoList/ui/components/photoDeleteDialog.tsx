import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';

export function PhotoDeleteDialog({
  count,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  count: number;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      destructive
      open={count > 0}
      onClose={() => !isDeleting && onCancel()}
      title={count > 1 ? `사진 ${count}장을 삭제하시겠습니까?` : '사진을 삭제하시겠습니까?'}
      description="삭제 후에는 되돌릴 수 없습니다."
    >
      <DialogActions>
        <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
          취소
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          isLoading={isDeleting}
          loadingText="삭제 중…"
        >
          삭제하기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
