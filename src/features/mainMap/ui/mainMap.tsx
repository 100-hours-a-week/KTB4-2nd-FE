'use client';

import Script from 'next/script';

import type { TripMapMarker } from '../model/tripMapMarker';
import { useKakaoTripMap } from '../model/useKakaoTripMap';
import { useTripMarkerPopup } from '../model/useTripMarkerPopup';
import { TripMarkerPopup } from './tripMarkerPopup';

export { forgetMapViewport } from '../model/useKakaoTripMap';

const MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;

export function MainMap({
  trips,
  onTripSelect,
  resetSignal = 0,
}: {
  trips: TripMapMarker[];
  onTripSelect: (tripId: number) => void;
  resetSignal?: number;
}) {
  const popup = useTripMarkerPopup();
  const { containerRef, mapStatus, onSdkReady, onSdkError } = useKakaoTripMap({
    trips,
    onTripSelect,
    resetSignal,
    onGroupOpen: popup.openPopup,
    onGroupDismiss: popup.dismissPopup,
  });
  return (
    <section className="relative h-full w-full overflow-hidden" aria-label="여행 지도">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="카카오 지도"
      />
      {MAP_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(MAP_KEY)}&autoload=false`}
          strategy="afterInteractive"
          onReady={onSdkReady}
          onError={onSdkError}
        />
      )}
      {(!MAP_KEY || mapStatus === 'error') && (
        <div className="absolute inset-0 flex items-center justify-center bg-app-background px-6 text-center">
          <p className="text-muted text-sm">지도를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
        </div>
      )}
      {MAP_KEY && mapStatus === 'loading' && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-app-background"
          role="status"
        >
          <p className="text-muted text-sm">지도를 불러오는 중이에요...</p>
        </div>
      )}
      {popup.openGroup && (
        <TripMarkerPopup
          openGroup={popup.openGroup}
          visibleCount={popup.visibleCount}
          closeButtonRef={popup.closeButtonRef}
          onClose={popup.closePopup}
          onScroll={popup.handleListScroll}
          onTripSelect={onTripSelect}
        />
      )}
    </section>
  );
}
