import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';

type UnclassifiedPhotoDeleteDialogProps = {
  count: number;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function UnclassifiedPhotoDeleteDialog({
  count,
  isDeleting,
  onCancel,
  onConfirm,
}: UnclassifiedPhotoDeleteDialogProps) {
  return (
    <Dialog
      destructive
      open={count > 0}
      onClose={() => !isDeleting && onCancel()}
      title={count > 1 ? `사진 ${count}장을 삭제하시겠습니까?` : '정말 삭제하시겠습니까?'}
      description="삭제 후에는 되돌릴 수 없습니다."
    >
      <DialogActions>
        <Button variant="secondary" onClick={onCancel} disabled={isDeleting} className="w-full">
          취소
        </Button>
        <Button variant="destructive" onClick={onConfirm} isLoading={isDeleting} className="w-full">
          삭제하기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
