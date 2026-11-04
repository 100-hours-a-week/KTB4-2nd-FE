import Link from 'next/link';

import {
  groupSearchPhotosByTrip,
  type SearchFolder,
  type SearchPhoto,
  type SearchPhotoGroup,
} from '@/features/search';
import { ChevronRightIcon } from '@/shared/ui/icons';

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

  return (
    <div className="mt-4 space-y-6">
      {groupSearchPhotosByTrip(photos).map((group) => (
        <PhotoGroup key={group.tripId} group={group} folderByPlaceId={folderByPlaceId} />
      ))}
    </div>
  );
}

function PhotoGroup({
  group,
  folderByPlaceId,
}: {
  group: SearchPhotoGroup;
  folderByPlaceId: Map<number, SearchFolder>;
}) {
  const headingId = `search-photo-group-${group.tripId}`;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate text-sm font-extrabold tracking-[-0.01em]">
            {group.tripName}
          </span>{' '}
          <span className="text-muted shrink-0 text-[11px] font-semibold tabular-nums">
            {group.photos.length}장
          </span>
        </h2>
        <Link
          href={`/trips/${group.tripId}`}
          aria-label={`${group.tripName} 여행 폴더 열기`}
          className="text-muted hover:text-brand focus-visible:outline-brand flex shrink-0 items-center gap-0.5 rounded text-[11px] font-semibold transition-colors focus-visible:outline-2"
        >
          폴더 열기
          <ChevronRightIcon strokeWidth="2" size="13" />
        </Link>
      </div>

      <ul aria-label={`${group.tripName} 사진`} className="grid grid-cols-3 gap-1">
        {group.photos.map((photo, index) => (
          <li key={photo.id}>
            <Link
              href={placePhotosHref(
                folderByPlaceId.get(photo.tripPlaceId) ?? {
                  tripId: photo.tripId,
                  tripPlaceId: photo.tripPlaceId,
                  tripName: photo.tripName,
                },
              )}
              aria-label={`${group.tripName}의 ${index + 1}번째 사진이 있는 폴더 보기`}
              className="focus-visible:outline-brand relative block aspect-square w-full overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1"
            >
              <PhotoArtwork photo={photo} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
