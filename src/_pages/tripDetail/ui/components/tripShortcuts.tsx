import Link from 'next/link';

import { ChevronRightIcon, DocumentIcon, FolderWarningIcon } from '@/shared/ui/icons';

export function TripShortcuts({
  tripId,
  tripName,
  onOpenStory,
}: {
  tripId: number;
  tripName: string;
  onOpenStory: () => void;
}) {
  return (
    <section aria-label="여행 바로가기" className="mt-5 grid grid-cols-[1fr_100px] gap-2.5">
      <button
        type="button"
        onClick={onOpenStory}
        className="bg-brand hover:bg-brand-hover focus-visible:outline-brand flex min-h-[66px] cursor-pointer items-center gap-3 rounded-[14px] px-4 text-left text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/10">
          <DocumentIcon size="19" variant="story" />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm">스토리 보기</strong>
          <span className="mt-0.5 block truncate text-[10px] text-white/60">
            자동 생성된 여행일기
          </span>
        </span>
        <ChevronRightIcon strokeWidth="2" size="16" />
      </button>

      <Link
        href={`/trips/${tripId}/unclassified?trip=${encodeURIComponent(tripName)}`}
        className="focus-visible:outline-warning relative flex min-h-[66px] cursor-pointer flex-col justify-center rounded-[14px] bg-[#fff4d8] px-3 text-left text-[#71511b] transition-colors hover:bg-[#ffedc0] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <FolderWarningIcon size="21" />
        <strong className="mt-1 text-[11px]">확인 필요</strong>
      </Link>
    </section>
  );
}
