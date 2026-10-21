import { PHOTO_ACCENT_GRADIENT } from '@/features/photoList';
import type { SearchPhoto } from '@/features/search';

export function PhotoArtwork({ photo }: { photo: SearchPhoto }) {
  if (photo.thumbnailUrl) {
    return (
      <span
        aria-hidden="true"
        className="block size-full bg-slate-100 bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(photo.thumbnailUrl)})` }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`relative block size-full overflow-hidden bg-gradient-to-b ${PHOTO_ACCENT_GRADIENT[photo.accent]}`}
    >
      <span className="absolute top-[14%] right-[14%] size-[17%] rounded-full bg-[#ffe59a]" />
      <span className="absolute -right-[8%] bottom-[-10%] h-[42%] w-[82%] rounded-[50%] bg-black/15" />
      <span className="absolute bottom-[-13%] -left-[10%] h-[48%] w-[92%] rounded-[50%] bg-white/18" />
    </span>
  );
}
