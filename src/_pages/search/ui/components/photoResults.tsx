import Link from 'next/link';

import type { SearchFolder, SearchPhoto } from '@/features/search';

import { placePhotosHref } from '../../lib/placePhotosHref';
import { EmptyTabResult } from './emptyTabResult';
import { PhotoArtwork } from './photoArtwork';

export function PhotoResults({
  photos,
  folders,
}: {
  photos: SearchPhoto[];
  folders: SearchFolder[];
}) {
  if (photos.length === 0) return <EmptyTabResult message="일치하는 사진이 없어요." />;
  const folderByPlaceId = new Map(folders.map((folder) => [folder.tripPlaceId, folder]));
  const tripNameByTripId = new Map(folders.map((folder) => [folder.tripId, folder.tripName]));

  return (
    <ul aria-label="사진 검색 결과" className="mt-4 grid grid-cols-3 gap-1">
      {photos.map((photo, index) => (
        <li key={photo.id}>
          <Link
            href={placePhotosHref(
              folderByPlaceId.get(photo.tripPlaceId) ?? {
                tripId: photo.tripId,
                tripPlaceId: photo.tripPlaceId,
                tripName: tripNameByTripId.get(photo.tripId),
              },
            )}
            aria-label={`${index + 1}번째 사진이 있는 폴더 보기`}
            className="focus-visible:outline-brand relative block aspect-square w-full overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1"
          >
            <PhotoArtwork photo={photo} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
