'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';

import { PhotoViewer, usePhotoDownload } from '@/features/photoList';
import {
  groupSearchPhotosByTrip,
  type SearchFolder,
  type SearchPhoto,
  type SearchPhotoGroup,
} from '@/features/search';
import { ChevronRightIcon } from '@/shared/ui/icons';

import { FROM_SEARCH_PARAM } from '../../lib/fromSearch';
import { useSearchPhotoDetail } from '../../model/useSearchPhotoDetail';
import { EmptyTabResult } from './emptyTabResult';
import { PhotoArtwork } from './photoArtwork';

export function PhotoResults({
  photos,
  folders,
}: {
  photos: SearchPhoto[];
  folders: SearchFolder[];
}) {
  const detail = useSearchPhotoDetail(photos);
  const { mutate: requestDownload, isPending: isDownloading } = usePhotoDownload();

  if (photos.length === 0) return <EmptyTabResult message="일치하는 사진이 없어요." />;

  const folderByPlaceId = new Map(folders.map((folder) => [folder.tripPlaceId, folder]));
  const opened = detail.openedPhoto;
  const openedFolder = opened ? folderByPlaceId.get(opened.tripPlaceId) : undefined;

  return (
    <div className="mt-4 space-y-6">
      {groupSearchPhotosByTrip(photos).map((group) => (
        <PhotoGroup key={group.tripId} group={group} onOpen={detail.open} />
      ))}
      {opened &&
        createPortal(
          <PhotoViewer
            photo={opened}
            tripName={opened.tripName}
            placeName={openedFolder?.placeName ?? opened.tripName}
            actionsDisabled={isDownloading}
            onClose={detail.close}
            onDownload={() => requestDownload([opened.id])}
          />,
          document.body,
        )}
    </div>
  );
}

function PhotoGroup({
  group,
  onOpen,
}: {
  group: SearchPhotoGroup;
  onOpen: (photo: SearchPhoto) => void;
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
          href={`/trips/${group.tripId}?${FROM_SEARCH_PARAM}`}
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
            <button
              type="button"
              onClick={() => onOpen(photo)}
              aria-label={`${group.tripName}의 ${index + 1}번째 사진 보기`}
              className="focus-visible:outline-brand relative block aspect-square w-full overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1"
            >
              <PhotoArtwork photo={photo} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
