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
}) {
  return (
    <header className="bg-surface/95 sticky top-0 z-20 -mx-4 grid min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] grid-cols-[64px_1fr_64px] items-center px-4 pt-[max(20px,env(safe-area-inset-top))] backdrop-blur-sm">
      {selectionMode ? (
        <button
          type="button"
          onClick={onCancelSelection}
          className="focus-visible:outline-brand justify-self-start rounded px-1 py-2 text-sm font-bold focus-visible:outline-2"
        >
          취소
        </button>
      ) : (
        <IconButton onClick={onBack} aria-label="여행 상세로 돌아가기" className="hover:bg-brand/5">
          <ChevronLeftIcon aria-hidden="true" strokeWidth="2" size="22" />
        </IconButton>
      )}

      <h1 className="truncate text-center text-[17px] font-extrabold">
        {selectionMode ? `${selectedCount}장 선택됨` : placeName}
      </h1>

      {canSelect && (
        <button
          type="button"
          onClick={selectionMode ? onToggleAll : onEnterSelection}
          disabled={selectionDisabled}
          className="focus-visible:outline-brand justify-self-end rounded px-1 py-2 text-sm font-bold focus-visible:outline-2"
        >
          {selectionMode ? (allSelected ? '전체 해제' : '전체 선택') : '선택'}
        </button>
      )}
    </header>
  );
}
