import type { SearchFolder } from '@/features/search';
import { getThumbnailFallbackGradient } from '@/shared/config/thumbnailGradient';

export function FolderThumbnail({
  folder,
  colorIndex,
}: {
  folder: SearchFolder;
  colorIndex: number;
}) {
  if (folder.thumbnailUrl) {
    return (
      <span
        aria-hidden="true"
        className="block size-20.5 shrink-0 rounded-[13px] bg-slate-100 bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(folder.thumbnailUrl)})` }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`relative block size-20.5 shrink-0 overflow-hidden rounded-[13px] bg-linear-to-br ${getThumbnailFallbackGradient(colorIndex)}`}
    >
      <span className="absolute -right-2.5 -bottom-4.5 size-16 rounded-full bg-white/20" />
      <span className="absolute bottom-3 left-3 h-1.5 w-12 rounded-full bg-white/30" />
    </span>
  );
}
