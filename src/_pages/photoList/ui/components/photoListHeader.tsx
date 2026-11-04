import { Button } from '@/shared/ui/button';
import { ChevronLeftIcon } from '@/shared/ui/icons';
import { IconButton } from '@/shared/ui/iconButton';

export function PhotoListHeader({
  placeName,
  selectionMode,
  selectedCount,
  allSelected,
  canSelect,
  onBack,
  onEnterSelection,
  onCancelSelection,
  onToggleAll,
  selectionDisabled = false,
  cancelDisabled = false,
}: {
  placeName: string;
  selectionMode: boolean;
  selectedCount: number;
  allSelected: boolean;
  canSelect: boolean;
  onBack: () => void;
  onEnterSelection: () => void;
  onCancelSelection: () => void;
  onToggleAll: () => void;
  selectionDisabled?: boolean;
  cancelDisabled?: boolean;
}) {
  return (
    <header className="bg-surface/95 sticky top-0 z-20 -mx-4 grid min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] grid-cols-[88px_minmax(0,1fr)_88px] items-center px-4 pt-[max(20px,env(safe-area-inset-top))] backdrop-blur-sm">
      {selectionMode ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancelSelection}
          disabled={cancelDisabled}
          className="justify-self-start"
        >
          취소
        </Button>
      ) : (
        <IconButton onClick={onBack} aria-label="여행 상세로 돌아가기" className="hover:bg-brand/5">
          <ChevronLeftIcon aria-hidden="true" strokeWidth="2" size="22" />
        </IconButton>
      )}

      <h1 className="text-section-title truncate text-center">
        {selectionMode ? `${selectedCount}장 선택됨` : placeName}
      </h1>

      {canSelect && (
        <Button
          variant="ghost"
          size="sm"
          onClick={selectionMode ? onToggleAll : onEnterSelection}
          disabled={selectionDisabled}
          className="justify-self-end whitespace-nowrap"
        >
          {selectionMode ? (allSelected ? '전체 해제' : '전체 선택') : '선택'}
        </Button>
      )}
    </header>
  );
}
