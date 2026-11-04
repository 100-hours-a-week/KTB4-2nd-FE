import { Button } from '@/shared/ui/button';
import { RestoreIcon, TrashIcon } from '@/shared/ui/icons';

type UnclassifiedPhotoActionsProps = {
  selectedCount: number;
  isRestoring: boolean;
  isDeleting: boolean;
  onRestore: () => void;
  onDelete: () => void;
};

export function UnclassifiedPhotoActions({
  selectedCount,
  isRestoring,
  isDeleting,
  onRestore,
  onDelete,
}: UnclassifiedPhotoActionsProps) {
  const disabled = selectedCount === 0 || isRestoring || isDeleting;

  return (
    <div
      role="toolbar"
      aria-label="선택한 사진 작업"
      className="bg-surface border-border-subtle grid grid-cols-2 gap-2 border-t px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
    >
      <Button
        variant="secondary"
        disabled={disabled}
        isLoading={isRestoring}
        loadingText="해제 중…"
        onClick={onRestore}
      >
        <RestoreIcon aria-hidden="true" size="17" /> 해제
      </Button>
      <Button
        variant="destructive"
        disabled={disabled}
        isLoading={isDeleting}
        loadingText="삭제 중…"
        onClick={onDelete}
      >
        <TrashIcon aria-hidden="true" size="17" /> 삭제
      </Button>
    </div>
  );
}
