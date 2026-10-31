import { useCallback, useEffect, useRef, useState } from 'react';

import type { KakaoCustomOverlay, KakaoMap } from '@/features/mainMap/lib/kakaoMaps';
import {
  fitMap,
  type FitMapOptions,
  isValidPosition,
  KOREA_CENTER,
} from '@/features/mainMap/lib/tripMapView';

import { groupPlacesAtSamePosition, makePlaceMarkerContent } from '../lib/placeMapMarker';
import type { TripPlaceMarker } from './types';

const FIT_OPTIONS: FitMapOptions = { padding: [72, 32, 16, 32], singleLevel: 6 };

type UseKakaoPlaceMapOptions = {
  places: TripPlaceMarker[];
  onPlacesSelect: (places: TripPlaceMarker[], marker: HTMLElement) => void;
  onPlacesDismiss?: () => void;
};

export function useKakaoPlaceMap({
  places,
  onPlacesSelect,
  onPlacesDismiss,
}: UseKakaoPlaceMapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const placesRef = useRef(places);
  const onPlacesSelectRef = useRef(onPlacesSelect);
  const dismissRef = useRef(onPlacesDismiss);
  useEffect(() => {
    dismissRef.current = onPlacesDismiss;
  }, [onPlacesDismiss]);
  const interactedRef = useRef(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const onSdkError = useCallback(() => setMapStatus('error'), []);
  const onSdkReady = useCallback(() => {
    if (window.kakao?.maps) setSdkReady(true);
    else setMapStatus('error');
  }, []);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);
  useEffect(() => {
    onPlacesSelectRef.current = onPlacesSelect;
  }, [onPlacesSelect]);

  const drawMarkers = useCallback(() => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    overlaysRef.current = groupPlacesAtSamePosition(placesRef.current.filter(isValidPosition)).map(
      (group) => {
        const place = group[0];
        const content = makePlaceMarkerContent(
          place,
          () => onPlacesSelectRef.current(group, content),
          group.length,
        );
        return new maps.CustomOverlay({
          map,
          position: new maps.LatLng(place.latitude, place.longitude),
          content,
          clickable: true,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: 2,
        });
      },
    );
  }, []);

  useEffect(() => {
    if (!sdkReady || !containerRef.current) return;
    let active = true;
    let cleanup: (() => void) | undefined;
    const maps = window.kakao?.maps;
    if (!maps) return;
    maps.load(() => {
      if (!active || !containerRef.current) return;
      const container = containerRef.current;
      container.replaceChildren();
      const map = new maps.Map(container, {
        center: new maps.LatLng(KOREA_CENTER.latitude, KOREA_CENTER.longitude),
        level: 12,
      });
      mapRef.current = map;
      map.setMinLevel(1);
      map.setMaxLevel(14);
      const onIdle = () => {
        dismissRef.current?.();
        if (container.isConnected && container.clientWidth > 0) drawMarkers();
      };
      maps.event.addListener(map, 'idle', onIdle);
      const markInteracted = () => {
        interactedRef.current = true;
        dismissRef.current?.();
      };
      container.addEventListener('pointerdown', markInteracted);
      container.addEventListener('wheel', markInteracted);
      const resizeObserver = new ResizeObserver(() => {
        if (!container.isConnected || container.clientWidth === 0 || container.clientHeight === 0)
          return;
        dismissRef.current?.();
        const center = map.getCenter();
        map.relayout();
        if (interactedRef.current) map.setCenter(center);
        else fitMap(map, maps, placesRef.current.filter(isValidPosition), FIT_OPTIONS);
      });
      resizeObserver.observe(container);
      const readyFrame = requestAnimationFrame(() => {
        if (!active || mapRef.current !== map) return;
        map.relayout();
        fitMap(map, maps, placesRef.current.filter(isValidPosition), FIT_OPTIONS);
        drawMarkers();
        setMapStatus('ready');
      });
      cleanup = () => {
        cancelAnimationFrame(readyFrame);
        resizeObserver.disconnect();
        maps.event.removeListener(map, 'idle', onIdle);
        container.removeEventListener('pointerdown', markInteracted);
        container.removeEventListener('wheel', markInteracted);
        container.replaceChildren();
      };
    });
    return () => {
      active = false;
      cleanup?.();
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
    };
  }, [sdkReady, drawMarkers]);

  const placeSignature = places
    .map((place) =>
      [
        place.id,
        place.name,
        place.latitude,
        place.longitude,
        place.photoCount,
        place.thumbnailUrl,
      ].join(':'),
    )
    .join('|');

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    if (!interactedRef.current)
      fitMap(map, maps, placesRef.current.filter(isValidPosition), FIT_OPTIONS);
    drawMarkers();
  }, [placeSignature, drawMarkers]);

  return { containerRef, mapStatus, onSdkReady, onSdkError };
}
