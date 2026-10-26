import type { TripSortOrder } from '@/features/tripList';
import { SelectDropdown } from '@/shared/ui/selectDropdown';

export function TripListToolbar({
  sortOrder,
  favoriteOnly,
  onSortChange,
  onFavoriteOnlyChange,
}: {
  sortOrder: TripSortOrder;
  favoriteOnly: boolean;
  onSortChange: (sortOrder: TripSortOrder) => void;
  onFavoriteOnlyChange: (checked: boolean) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <SelectDropdown
        label="여행 정렬"
        value={sortOrder}
        onChange={onSortChange}
        options={[
          { value: 'newest', label: '최신순' },
          { value: 'oldest', label: '오래된순' },
        ]}
      />
      <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs font-bold">
        <span>즐겨찾기만</span>
        <input
          type="checkbox"
          role="switch"
          aria-label="즐겨찾기만 보기"
          checked={favoriteOnly}
          onChange={(event) => onFavoriteOnlyChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="peer-checked:bg-brand peer-checked:[&>span]:translate-x-4 peer-focus-visible:ring-brand/50 relative h-6 w-10 rounded-full bg-slate-300 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2">
          <span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow-sm transition-transform" />
        </span>
      </label>
    </div>
  );
}
