'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconButton } from '@/shared/ui/iconButton';
import { Button } from '@/shared/ui/button';
import { CloseIcon } from '@/shared/ui/icons';
import type { TripPlaceMarker } from '../model/types';

import { tripDetailQueries } from '@/queryFactory';

import { placePhotosHref } from '../model/placePhotosHref';
import { useKakaoPlaceMap } from '../model/useKakaoPlaceMap';

const MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;

export function TripPlaceMap({ tripId, tripName }: { tripId: number; tripName: string }) {
  const router = useRouter();
  const [selection, setSelection] = useState<{
    places: TripPlaceMarker[];
    left: number;
    top: number;
    maxHeight: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dismissPopup = useCallback(() => setSelection(null), []);
  const closePopup = useCallback(() => {
    setSelection(null);
    if (triggerRef.current?.isConnected) triggerRef.current.focus();
  }, []);
  const { data: places, isError, refetch } = useQuery(tripDetailQueries.placeMap(tripId));
  const { containerRef, mapStatus, onSdkReady, onSdkError } = useKakaoPlaceMap({
    places: places ?? [],
    onPlacesDismiss: dismissPopup,
    onPlacesSelect: (group, marker) => {
      if (group.length === 1)
        router.push(placePhotosHref({ id: tripId, name: tripName }, group[0]));
      else {
        const container = containerRef.current;
        if (!container) return;
        const bounds = container.getBoundingClientRect();
        const pin = marker.getBoundingClientRect();
        const image = marker.querySelector('.trip-map-pin')?.getBoundingClientRect();
        const width = Math.min(192, Math.max(0, bounds.width - 16));
        const maxHeight = Math.min(232, Math.max(0, bounds.height - 16));
        const height = Math.min(44 + group.length * 56 + 8, maxHeight);
        const markerTop = Math.min(pin.top, image?.top ?? pin.top) - bounds.top;
        const markerBottom = Math.max(pin.bottom, image?.bottom ?? pin.bottom) - bounds.top;
        const below = markerBottom + 8;
        const desiredTop = below + height <= bounds.height - 8 ? below : markerTop - height - 8;
        triggerRef.current = marker;
        setSelection({
          places: group,
          width,
          maxHeight,
          left: Math.max(
            8,
            Math.min(pin.left + pin.width / 2 - bounds.left - width / 2, bounds.width - width - 8),
          ),
          top: Math.max(8, Math.min(desiredTop, bounds.height - height - 8)),
        });
      }
    },
  });

  useEffect(() => {
    if (!selection) return;
    closeRef.current?.focus();
    const pointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !popupRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      )
        dismissPopup();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePopup();
      }
    };
    document.addEventListener('pointerdown', pointerDown);
    document.addEventListener('keydown', keyDown);
    return () => {
      document.removeEventListener('pointerdown', pointerDown);
      document.removeEventListener('keydown', keyDown);
    };
  }, [selection, closePopup, dismissPopup]);

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
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              다시 시도
            </Button>
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
      {selection && (
        <div
          ref={popupRef}
          role="dialog"
          aria-label="장소 목록"
          className="bg-surface shadow-menu absolute z-30 flex flex-col overflow-hidden rounded-row p-1"
          style={{
            left: selection.left,
            top: selection.top,
            width: selection.width,
            maxHeight: selection.maxHeight,
          }}
        >
          <div className="flex shrink-0 items-center justify-between pl-2">
            <h2 className="text-brand text-xs font-bold">장소 목록</h2>
            <IconButton ref={closeRef} aria-label="장소 목록 닫기" onClick={closePopup}>
              <CloseIcon aria-hidden="true" size="18" />
            </IconButton>
          </div>
          <ul className="min-h-0 overflow-y-auto overscroll-contain">
            {selection.places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  className="text-brand hover:bg-surface-subtle focus-visible:outline-brand flex min-h-14 w-full items-center gap-2.5 rounded-control px-2 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2"
                  aria-label={`${place.name} 사진 ${place.photoCount}장 보기`}
                  onClick={() => {
                    dismissPopup();
                    router.push(placePhotosHref({ id: tripId, name: tripName }, place));
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="block size-10 shrink-0 rounded-full bg-surface-subtle bg-cover bg-center"
                    style={
                      place.thumbnailUrl
                        ? { backgroundImage: `url(${JSON.stringify(place.thumbnailUrl)})` }
                        : undefined
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{place.name}</span>
                    <span className="text-muted block text-caption">사진 {place.photoCount}장</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
