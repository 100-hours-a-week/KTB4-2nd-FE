import type { Ref, UIEventHandler } from 'react';

import { IconButton } from '@/shared/ui/iconButton';
import { CloseIcon } from '@/shared/ui/icons';

import type { OpenTripMarkerGroup } from '../model/useTripMarkerPopup';

type TripMarkerPopupProps = {
  openGroup: OpenTripMarkerGroup;
  visibleCount: number;
  closeButtonRef: Ref<HTMLButtonElement>;
  onClose: () => void;
  onScroll: UIEventHandler<HTMLDivElement>;
  onTripSelect: (tripId: number) => void;
};

function TripPopupThumbnail({
  thumbnailUrl,
  tripName,
}: {
  thumbnailUrl: string | null;
  tripName: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${tripName} 대표 이미지`}
      className="block size-10 shrink-0 rounded-full bg-slate-200 bg-cover bg-center"
      style={thumbnailUrl ? { backgroundImage: `url(${JSON.stringify(thumbnailUrl)})` } : undefined}
    />
  );
}

export function TripMarkerPopup({
  openGroup,
  visibleCount,
  closeButtonRef,
  onClose,
  onScroll,
  onTripSelect,
}: TripMarkerPopupProps) {
  return (
    <div
      role="dialog"
      aria-label="여행 목록"
      className={`absolute z-30 w-48 -translate-x-1/2 overflow-hidden rounded-xl bg-white p-1 shadow-xl ${openGroup.placement === 'above' ? '-translate-y-full' : ''}`}
      style={{ left: openGroup.x, top: openGroup.y }}
    >
      <div className="flex items-center justify-between pl-2">
        <h2 className="text-brand text-xs font-bold">여행 목록</h2>
        <IconButton
          ref={closeButtonRef}
          aria-label="여행 목록 닫기"
          onClick={onClose}
          className="hover:bg-surface-subtle"
        >
          <CloseIcon aria-hidden="true" size="18" />
        </IconButton>
      </div>
      <div
        className={`overflow-y-auto ${openGroup.group.trips.length > visibleCount ? 'h-40' : 'max-h-44'}`}
        onScroll={onScroll}
      >
        {openGroup.group.trips.slice(0, visibleCount).map((trip) => (
          <button
            key={trip.tripId}
            type="button"
            className="flex min-h-14 w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-brand hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand"
            onClick={() => onTripSelect(trip.tripId)}
          >
            <TripPopupThumbnail thumbnailUrl={trip.thumbnailUrl} tripName={trip.tripName} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{trip.tripName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
