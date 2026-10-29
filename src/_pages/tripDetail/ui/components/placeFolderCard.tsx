import Link from 'next/link';

import { DecodedThumbnail } from '@/shared/ui/decodedThumbnail';

import {
  PLACE_FOLDER_ACCENT_GRADIENT,
  placePhotosHref,
  type TripDetail,
  type TripPlaceFolder,
} from '@/features/tripDetail';

export function PlaceFolderCard({ trip, folder }: { trip: TripDetail; folder: TripPlaceFolder }) {
  const href = placePhotosHref(trip, folder);

  return (
    <Link
      href={href}
      aria-label={`${folder.name} 사진 ${folder.photoCount}장 보기`}
      className="focus-visible:outline-brand block w-full cursor-pointer rounded-[14px] text-left transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <FolderThumbnail folder={folder} tripId={trip.id} />
      <strong className="mt-2 block truncate text-[13px] font-extrabold">{folder.name}</strong>
      <span className="text-muted mt-0.5 block text-[10px]">{folder.photoCount}장</span>
    </Link>
  );
}

function FolderThumbnail({ folder, tripId }: { folder: TripPlaceFolder; tripId: number }) {
  return (
    <DecodedThumbnail
      imageKey={`${tripId}:${folder.id}`}
      src={folder.thumbnailUrl}
      className="aspect-square w-full rounded-[14px]"
      fallback={
        <span
          className={`relative block size-full overflow-hidden bg-gradient-to-b ${PLACE_FOLDER_ACCENT_GRADIENT[folder.accent]}`}
        >
          <span className="absolute right-[14%] top-[16%] size-[18%] rounded-full bg-[#ffe7a6]" />
          <span className="absolute -right-[8%] bottom-[-8%] h-[42%] w-[80%] rounded-[50%] bg-black/16" />
          <span className="absolute -left-[12%] bottom-[-10%] h-[48%] w-[90%] rounded-[50%] bg-white/18" />
        </span>
      }
    />
  );
}
