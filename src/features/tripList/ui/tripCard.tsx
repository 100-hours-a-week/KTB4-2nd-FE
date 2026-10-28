'use client';

import Link from 'next/link';

import { getThumbnailFallbackGradient } from '@/shared/config/thumbnailGradient';
import { DecodedThumbnail } from '@/shared/ui/decodedThumbnail';
import { ImageIcon, StarIcon } from '@/shared/ui/icons';
import { toast } from '@/shared/ui/toast';

import type { TripListItem } from '../model/types';

export function TripCard({
  trip,
  colorIndex,
  onFavoriteChange,
  onTripSelect,
}: {
  trip: TripListItem;
  colorIndex: number;
  onFavoriteChange: (tripId: number) => void;
  onTripSelect?: (tripId: number) => void;
}) {
  const updating = trip.processingStatus === 'updating';

  return (
    <article className="border-border-subtle bg-surface relative flex min-h-[106px] overflow-hidden rounded-[18px] border p-3 shadow-[0_2px_8px_rgba(2,23,48,0.03)] transition-transform active:scale-[0.99]">
      {updating ? (
        <button
          type="button"
          aria-label={`${trip.name} 여행 수정 중`}
          aria-disabled="true"
          onClick={() => toast.info('여행을 수정하고 있어요. 끝나면 다시 열어주세요.')}
          className="absolute inset-0 cursor-not-allowed rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
        />
      ) : onTripSelect ? (
        <button
          type="button"
          aria-label={`${trip.name} 여행 상세 보기`}
          onClick={() => onTripSelect(trip.id)}
          className="absolute inset-0 cursor-pointer rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
        />
      ) : (
        <Link
          href={
            trip.processingStatus === 'processing'
              ? `/trips/${trip.id}/processing`
              : `/trips/${trip.id}`
          }
          aria-label={`${trip.name} 여행 상세 보기`}
          className="absolute inset-0 cursor-pointer rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
        />
      )}
      <TripThumbnail trip={trip} colorIndex={colorIndex} />
      <div className="pointer-events-none z-10 min-w-0 flex-1 py-0.5 pl-3 pr-7">
        <h3 className="truncate text-sm font-extrabold tracking-[-0.01em]">{trip.name}</h3>
        <p className="text-muted mt-1 truncate text-[11px]">
          {trip.locations.slice(0, 3).join(', ')}
        </p>
        <p className="text-muted mt-1 truncate text-[11px]">
          {formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)} · {trip.nights}박
        </p>
        {trip.processingStatus === 'processing' ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#3973b9]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#3973b9]" />
            여담이 사진을 정리하고 있어요
          </p>
        ) : updating ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#3973b9]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#3973b9]" />
            여담이 여행을 수정하고 있어요
          </p>
        ) : (
          <p className="text-muted mt-1 flex items-center gap-1 text-[11px]">
            <ImageIcon size="12" /> 사진 {trip.photoCount}장
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={`${trip.name} ${trip.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}`}
        aria-pressed={trip.favorite}
        onClick={() => onFavoriteChange(trip.id)}
        className="focus-visible:outline-brand absolute top-3 right-3 z-20 grid size-7 cursor-pointer place-items-center rounded-full focus-visible:outline-2"
      >
        <StarIcon
          fill={trip.favorite ? '#f7b51d' : 'none'}
          stroke={trip.favorite ? '#f7b51d' : '#a5b0be'}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          size="20"
        />
      </button>
    </article>
  );
}

function TripThumbnail({ trip, colorIndex }: { trip: TripListItem; colorIndex: number }) {
  const updating = trip.processingStatus === 'updating';
  const processing = trip.processingStatus === 'processing' && !trip.thumbnailUrl;
  return (
    <DecodedThumbnail
      imageKey={trip.id}
      src={trip.thumbnailUrl}
      className="h-[82px] w-[82px] shrink-0 rounded-[13px]"
      fallback={
        <div
          className={`relative size-full overflow-hidden bg-gradient-to-br ${getThumbnailFallbackGradient(colorIndex)}`}
        >
          <span className="absolute right-[-10px] bottom-[-18px] size-16 rounded-full bg-white/20" />
          <span className="absolute bottom-3 left-3 h-1.5 w-12 rounded-full bg-white/30" />
        </div>
      }
    >
      {(updating || processing) && (
        <div
          className={`absolute inset-0 grid place-items-center ${trip.thumbnailUrl ? 'bg-white/60' : 'bg-slate-100'}`}
        >
          <span
            aria-label={updating ? '여행 수정 중' : '사진 정리 중'}
            role="status"
            className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand motion-reduce:animate-none"
          />
        </div>
      )}
    </DecodedThumbnail>
  );
}

function formatShortDate(date: string) {
  return date.slice(2).replaceAll('-', '.');
}
