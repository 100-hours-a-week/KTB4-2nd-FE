import type { PhotoAccent } from '@/features/photoList';
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

  const accentClass: Record<PhotoAccent, string> = {
    coast: 'from-[#cee7f0] via-[#70abc5] to-[#e6d6a5]',
    night: 'from-[#34476f] via-[#1d2c50] to-[#0e1a2e]',
    blossom: 'from-[#d9edf3] via-[#f4b9ca] to-[#8fb77b]',
    sunset: 'from-[#1d2945] via-[#293657] to-[#f1a456]',
    island: 'from-[#acd8ee] via-[#80b76d] to-[#407a3d]',
    desert: 'from-[#f4d9ad] via-[#d77b46] to-[#a94728]',
  };

  return (
    <span
      aria-hidden="true"
      className={`relative block size-full overflow-hidden bg-gradient-to-b ${accentClass[photo.accent]}`}
    >
      <span className="absolute top-[14%] right-[14%] size-[17%] rounded-full bg-[#ffe59a]" />
      <span className="absolute -right-[8%] bottom-[-10%] h-[42%] w-[82%] rounded-[50%] bg-black/15" />
      <span className="absolute bottom-[-13%] -left-[10%] h-[48%] w-[92%] rounded-[50%] bg-white/18" />
    </span>
  );
}
