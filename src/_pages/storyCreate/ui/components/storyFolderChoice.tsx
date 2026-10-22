'use client';

import { useState } from 'react';

import { STORY_FOLDER_ACCENT_GRADIENT, type StorySourceFolder } from '@/features/createStory';
import { CheckIcon } from '@/shared/ui/icons';

export function StoryFolderChoice({
  folder,
  selected,
  onToggle,
}: {
  folder: StorySourceFolder;
  selected: boolean;
  onToggle: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const empty = folder.photoCount === 0;
  return (
    <label
      className={`relative block aspect-[0.94] overflow-hidden rounded-[18px] bg-gradient-to-b ${STORY_FOLDER_ACCENT_GRADIENT[folder.accent]} ${empty ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      {folder.thumbnailUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={folder.thumbnailUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">
          <span className="absolute top-[32%] right-[20%] size-10 rounded-full bg-[#fff3c7]" />
          <span className="absolute -bottom-4 -left-5 h-[45%] w-[120%] rounded-[50%] bg-brand/25" />
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#021730]/85 to-transparent"
      />
      <input
        type="checkbox"
        aria-label={`${folder.name} 사진 ${folder.photoCount}장 선택`}
        checked={selected}
        disabled={empty}
        onChange={onToggle}
        className="peer focus-visible:outline-brand absolute top-3 left-3 z-10 size-6 cursor-pointer appearance-none rounded-lg border border-[#021730]/15 bg-white/85 checked:border-brand checked:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <CheckIcon
        className="pointer-events-none absolute top-3 left-3 z-10 hidden size-6 p-1 peer-checked:block"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        variant="selection"
      />
      <span className="absolute right-3 bottom-3 left-3 text-white">
        <strong className="block truncate text-sm font-extrabold">{folder.name}</strong>
        <span className="mt-1 block text-[11px]">{folder.photoCount}장</span>
      </span>
    </label>
  );
}
