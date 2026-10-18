import type { SearchFolder } from '@/features/search';

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

  const gradients = [
    'from-[#273a63] via-[#4d638c] to-[#172743]',
    'from-[#f3d5a2] via-[#d87743] to-[#9d3f25]',
    'from-[#cfe5ed] via-[#8ebaa6] to-[#528b9e]',
  ];

  return (
    <span
      aria-hidden="true"
      className={`relative block size-20.5 shrink-0 overflow-hidden rounded-[13px] bg-linear-to-br ${gradients[colorIndex % gradients.length]}`}
    >
      <span className="absolute -right-2.5 -bottom-4.5 size-16 rounded-full bg-white/20" />
      <span className="absolute bottom-3 left-3 h-1.5 w-12 rounded-full bg-white/30" />
    </span>
  );
}
