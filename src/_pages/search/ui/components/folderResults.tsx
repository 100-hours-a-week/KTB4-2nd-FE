import Link from 'next/link';

import type { SearchFolder } from '@/features/search';
import { ChevronRightIcon, ImageIcon } from '@/shared/ui/icons';

import { placePhotosHref } from '../../lib/placePhotosHref';
import { EmptyTabResult } from './emptyTabResult';
import { FolderThumbnail } from './folderThumbnail';

export function FolderResults({ folders }: { folders: SearchFolder[] }) {
  if (folders.length === 0) return <EmptyTabResult message="일치하는 폴더가 없어요." />;

  return (
    <ul className="mt-4 space-y-2.5">
      {folders.map((folder, index) => (
        <li key={folder.tripPlaceId}>
          <Link
            href={placePhotosHref(folder)}
            aria-label={`${folder.tripName} ${folder.placeName} 사진 ${folder.photoCount}장 보기`}
            className="border-border-subtle bg-surface focus-visible:outline-brand flex min-h-[106px] items-center rounded-[18px] border p-3 shadow-[0_2px_8px_rgba(2,23,48,0.03)] transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <FolderThumbnail folder={folder} colorIndex={index} />
            <span className="min-w-0 flex-1 py-0.5 pl-3">
              <strong className="block truncate text-sm font-extrabold tracking-[-0.01em]">
                {folder.placeName}
              </strong>
              <span className="text-muted mt-1 block truncate text-[11px]">{folder.tripName}</span>
              <span className="text-muted mt-1 flex items-center gap-1 text-[11px]">
                <ImageIcon size="12" /> 사진 {folder.photoCount}장
              </span>
            </span>
            <span className="text-muted shrink-0 pl-2">
              <ChevronRightIcon strokeWidth="2" size="16" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
