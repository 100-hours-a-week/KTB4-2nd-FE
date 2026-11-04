import type { TripEditPhoto } from '../../api/getTripForEdit';

type ExistingTripPhotosProps = {
  existingPhotos: TripEditPhoto[];
  removedPhotoIds: Set<number>;
  disabled: boolean;
  onToggleRemove: (photoId: number) => void;
};

export function ExistingTripPhotos({
  existingPhotos,
  removedPhotoIds,
  disabled,
  onToggleRemove,
}: ExistingTripPhotosProps) {
  return (
    <section aria-labelledby="existing-photos-title" className="shrink-0">
      <div className="flex items-end justify-between gap-3">
        <p id="existing-photos-title" className="text-brand text-sm font-bold">
          기존 사진
        </p>
        <span className="text-muted text-xs tabular-nums">
          {existingPhotos.length}장
          {removedPhotoIds.size > 0 && (
            <>
              {' · '}
              <strong className="text-danger-strong">{removedPhotoIds.size}장 삭제 예정</strong>
            </>
          )}
        </span>
      </div>
      {existingPhotos.length === 0 ? (
        <p className="text-muted mt-2 text-xs">아직 올린 사진이 없어요.</p>
      ) : (
        <ul
          aria-label="기존 사진 목록"
          className="mt-2 flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {existingPhotos.map((photo, index) => {
            const removed = removedPhotoIds.has(photo.id);
            return (
              <li key={photo.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={removed}
                  aria-label={`${index + 1}번째 기존 사진 ${removed ? '삭제 취소' : '삭제'}`}
                  disabled={disabled}
                  onClick={() => onToggleRemove(photo.id)}
                  className="focus-visible:outline-brand relative block size-[72px] cursor-pointer overflow-hidden rounded-lg bg-[#eef3f9] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
                >
                  {photo.thumbnailUrl && (
                    <span
                      aria-hidden="true"
                      className={`block size-full bg-cover bg-center transition-opacity ${removed ? 'opacity-35' : ''}`}
                      style={{ backgroundImage: `url(${JSON.stringify(photo.thumbnailUrl)})` }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={`absolute top-1 right-1 grid size-5 place-items-center rounded-full text-[11px] font-bold text-white ${removed ? 'bg-danger-strong' : 'bg-black/45'}`}
                  >
                    {removed ? '↺' : '✕'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
