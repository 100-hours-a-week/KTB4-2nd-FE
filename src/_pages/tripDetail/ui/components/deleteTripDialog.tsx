import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';

export function DeleteTripDialog({
  open,
  tripName,
  photoCount,
  isDeleting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  tripName: string;
  photoCount: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      destructive
      open={open}
      onClose={onClose}
      title="정말 삭제하시겠습니까?"
      description={
        <>
          ‘{tripName}’과 사진 {photoCount}장이 삭제되며
          <br />
          삭제 후에는 되돌릴 수 없습니다.
        </>
      }
    >
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={isDeleting} className="w-full">
          취소
        </Button>
        <Button variant="destructive" onClick={onConfirm} isLoading={isDeleting} className="w-full">
          삭제하기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
