import { PhotoArtwork } from '@/features/photoList';
import type { UnclassifiedPhoto } from '@/features/unclassifiedPhotos';
import { ImageIcon } from '@/shared/ui/icons';

type UnclassifiedPhotoGridProps = {
  photos: UnclassifiedPhoto[];
  label: string;
  selectionMode: boolean;
  selectedIds: Set<number>;
  isSelectingAll: boolean;
  disabled: boolean;
  showEmpty: boolean;
  onTogglePhoto: (photoId: number) => void;
  onOpenPhoto: (photoId: number) => void;
};

export function UnclassifiedPhotoGrid({
  photos,
  label,
  selectionMode,
  selectedIds,
  isSelectingAll,
  disabled,
  showEmpty,
  onTogglePhoto,
  onOpenPhoto,
}: UnclassifiedPhotoGridProps) {
  if (showEmpty) return <EmptyPhotoList />;

  return (
    <ul
      aria-label={`${label} 목록`}
      className={`mt-3 grid grid-cols-3 gap-1 ${isSelectingAll ? 'pb-32' : selectionMode ? 'pb-20' : ''}`}
    >
      {photos.map((photo, index) => {
        const selected = selectedIds.has(photo.id);
        return (
          <li key={photo.id} data-photo-id={photo.id}>
            {selectionMode ? (
              <button
                type="button"
                disabled={disabled || isSelectingAll}
                aria-label={`${index + 1}번째 사진 ${selected ? '선택 해제' : '선택'}`}
                aria-pressed={selected}
                onClick={() => onTogglePhoto(photo.id)}
                className={`focus-visible:outline-brand relative block aspect-square w-full touch-manipulation cursor-pointer overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 ${selected ? 'ring-brand ring-2 ring-inset' : ''}`}
              >
                <PhotoArtwork photo={photo} />
                <SelectionMark selected={selected} />
              </button>
            ) : (
              <button
                type="button"
                aria-label={`${index + 1}번째 사진 상세보기`}
                onClick={() => onOpenPhoto(photo.id)}
                className="focus-visible:outline-brand relative block aspect-square w-full cursor-pointer overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1"
              >
                <PhotoArtwork photo={photo} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function EmptyPhotoList() {
  return (
    <section className="flex min-h-[68vh] flex-col items-center justify-center text-center">
      <span className="text-muted grid size-16 place-items-center rounded-full bg-slate-100">
        <ImageIcon strokeWidth="1.7" size="32" />
      </span>
      <h2 className="mt-4 text-base font-extrabold">폴더에 사진이 없어요</h2>
      <p className="text-muted mt-1 text-xs">확인할 사진을 모두 정리했어요.</p>
    </section>
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
