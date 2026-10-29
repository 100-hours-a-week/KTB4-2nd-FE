'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

import { tripDetailQueries } from '@/queryFactory';

import { placePhotosHref } from '../model/placePhotosHref';
import { useKakaoPlaceMap } from '../model/useKakaoPlaceMap';

const MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;

export function TripPlaceMap({ tripId, tripName }: { tripId: number; tripName: string }) {
  const router = useRouter();
  const { data: places, isError, refetch } = useQuery(tripDetailQueries.placeMap(tripId));
  const { containerRef, mapStatus, onSdkReady, onSdkError } = useKakaoPlaceMap({
    places: places ?? [],
    onPlaceSelect: (place) => router.push(placePhotosHref({ id: tripId, name: tripName }, place)),
  });

  const failed = !MAP_KEY || mapStatus === 'error' || isError;
  const loading = !failed && (mapStatus === 'loading' || !places);

  return (
    <div className="border-border-subtle relative h-[min(62dvh,560px)] overflow-hidden rounded-[16px] border">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="장소별 사진 지도"
      />
      {MAP_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(MAP_KEY)}&autoload=false`}
          strategy="afterInteractive"
          onReady={onSdkReady}
          onError={onSdkError}
        />
      )}
      {failed && (
        <div className="bg-surface absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-muted text-sm">지도를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
          {isError && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="bg-surface-subtle text-brand rounded-full px-4 py-2 text-sm font-bold"
            >
              다시 시도
            </button>
          )}
        </div>
      )}
      {loading && (
        <div
          className="bg-surface-subtle absolute inset-0 flex animate-pulse items-center justify-center"
          role="status"
        >
          <p className="text-muted text-sm">지도를 불러오는 중이에요...</p>
        </div>
      )}
      {!failed && !loading && places?.length === 0 && (
        <p className="text-muted pointer-events-none absolute inset-x-0 top-4 mx-auto w-fit rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow-[0_2px_8px_rgba(2,23,48,0.08)]">
          지도에 표시할 장소가 아직 없어요
        </p>
      )}
    </div>
  );
}
