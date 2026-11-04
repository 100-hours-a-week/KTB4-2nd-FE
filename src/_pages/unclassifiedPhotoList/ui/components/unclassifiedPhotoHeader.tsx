import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/iconButton';
import { ChevronLeftIcon } from '@/shared/ui/icons';

type UnclassifiedPhotoHeaderProps = {
  label: string;
  selectionMode: boolean;
  selectedCount: number;
  allSelected: boolean;
  canSelect: boolean;
  isProcessing: boolean;
  isSelectingAll: boolean;
  onBack: () => void;
  onCancelSelection: () => void;
  onEnterSelection: () => void;
  onToggleAll: () => void;
};

export function UnclassifiedPhotoHeader({
  label,
  selectionMode,
  selectedCount,
  allSelected,
  canSelect,
  isProcessing,
  isSelectingAll,
  onBack,
  onCancelSelection,
  onEnterSelection,
  onToggleAll,
}: UnclassifiedPhotoHeaderProps) {
  return (
    <header className="bg-surface/95 sticky top-0 z-20 -mx-4 grid min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] grid-cols-[88px_minmax(0,1fr)_88px] items-center px-4 pt-[max(20px,env(safe-area-inset-top))] backdrop-blur-sm">
      {selectionMode ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancelSelection}
          disabled={isProcessing}
          className="justify-self-start"
        >
          취소
        </Button>
      ) : (
        <IconButton
          onClick={onBack}
          aria-label="미분류 폴더로 돌아가기"
          className="hover:bg-brand/5"
        >
          <ChevronLeftIcon aria-hidden="true" strokeWidth="2" size="22" />
        </IconButton>
      )}

      <h1 className="text-section-title truncate text-center">
        {selectionMode ? `${selectedCount}장 선택됨` : label}
      </h1>

      {canSelect && (
        <Button
          variant="ghost"
          size="sm"
          onClick={selectionMode ? onToggleAll : onEnterSelection}
          disabled={isProcessing || isSelectingAll}
          className="justify-self-end whitespace-nowrap"
        >
          {selectionMode ? (allSelected ? '전체 해제' : '전체 선택') : '선택'}
        </Button>
      )}
    </header>
  );
}
