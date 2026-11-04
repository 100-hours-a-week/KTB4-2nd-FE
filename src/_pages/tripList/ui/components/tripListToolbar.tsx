import type { TripSortOrder } from '@/features/tripList';
import { SelectDropdown } from '@/shared/ui/selectDropdown';
import { Toggle } from '@/shared/ui/toggle';

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
      <Toggle
        size="sm"
        label="즐겨찾기만"
        aria-label="즐겨찾기만 보기"
        checked={favoriteOnly}
        onChange={(event) => onFavoriteOnlyChange(event.target.checked)}
      />
    </div>
  );
}
