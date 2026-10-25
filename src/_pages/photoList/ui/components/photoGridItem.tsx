'use client';

import { PhotoArtwork, type PhotoListItem } from '@/features/photoList';

import { useLongPress } from '../../lib/useLongPress';

export function PhotoGridItem({
  photo,
  index,
  selectionMode,
  selected,
  onActivate,
  onLongPress,
  disabled = false,
}: {
  photo: PhotoListItem;
  index: number;
  selectionMode: boolean;
  selected: boolean;
  onActivate: () => void;
  onLongPress: () => void;
  disabled?: boolean;
}) {
  const pressHandlers = useLongPress({
    onLongPress,
    onClick: onActivate,
    disabled: selectionMode || disabled,
  });

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={
        selectionMode
          ? `${index + 1}번째 사진 ${selected ? '선택 해제' : '선택'}`
          : `${index + 1}번째 사진 보기`
      }
      aria-pressed={selectionMode ? selected : undefined}
      {...pressHandlers}
      className={`focus-visible:outline-brand relative block aspect-square w-full touch-manipulation cursor-pointer overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 ${selected ? 'ring-brand ring-2 ring-inset' : ''}`}
    >
      <PhotoArtwork photo={photo} />
      {selectionMode && <SelectionMark selected={selected} />}
    </button>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full border-2 text-[11px] font-bold ${selected ? 'border-brand bg-brand text-white' : 'border-white bg-black/15 text-transparent'}`}
    >
      ✓
    </span>
  );
}
