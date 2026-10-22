import type { TripDetail } from '@/features/tripDetail';
import { CalendarIcon, ImageIcon, PinIcon } from '@/shared/ui/icons';

import { formatShortDate } from '../../lib/formatShortDate';

export function TripMeta({
  trip,
  unclassifiedCount,
}: {
  trip: TripDetail;
  unclassifiedCount: number;
}) {
  const location =
    trip.locations.length > 1
      ? `${trip.locations[0]} 외 ${trip.locations.length - 1}개`
      : (trip.locations[0] ?? '장소 없음');

  return (
    <section aria-label="여행 정보" className="text-muted mt-2 space-y-1 text-[12px] font-medium">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <PinIcon size="13" /> {location}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarIcon size="13" /> {formatShortDate(trip.startDate)} -{' '}
          {formatShortDate(trip.endDate)} · {trip.nights}박
        </span>
      </p>
      <p className="inline-flex items-center gap-1">
        <ImageIcon size="13" /> 정리된 사진 {trip.photoCount}장
        {unclassifiedCount > 0 && (
          <>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            미분류 {unclassifiedCount}장
          </>
        )}
      </p>
    </section>
  );
}
