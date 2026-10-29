import { useCallback, useEffect, useRef, useState } from 'react';

import type { KakaoCustomOverlay, KakaoMap } from '@/features/mainMap/lib/kakaoMaps';
import {
  fitMap,
  type FitMapOptions,
  isValidPosition,
  KOREA_CENTER,
} from '@/features/mainMap/lib/tripMapView';

import { clusterNearby } from '@/features/mainMap/model/tripMapMarker';

import { makePlaceMarkerContent, toPlaceMarkerGroup } from '../lib/placeMapMarker';
import type { TripPlaceMarker } from './types';

const FIT_OPTIONS: FitMapOptions = { padding: [72, 32, 16, 32], singleLevel: 6 };

type UseKakaoPlaceMapOptions = {
  places: TripPlaceMarker[];
  onPlaceSelect: (place: TripPlaceMarker) => void;
};

export function useKakaoPlaceMap({ places, onPlaceSelect }: UseKakaoPlaceMapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const placesRef = useRef(places);
  const onPlaceSelectRef = useRef(onPlaceSelect);
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
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  const drawMarkers = useCallback(() => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    const projection = map.getProjection();
    const clusters = clusterNearby(placesRef.current.filter(isValidPosition), (place) =>
      projection.containerPointFromCoords(new maps.LatLng(place.latitude, place.longitude)),
    );
    overlaysRef.current = clusters.map((places) => {
      const group = toPlaceMarkerGroup(places);
      const onClick = () => {
        // 겹친 장소는 서로 떨어져 보일 때까지 확대한다. 더 확대할 수 없으면 대표 장소를 연다.
        if (places.length === 1 || map.getLevel() <= 1) {
          onPlaceSelectRef.current(group.lead);
          return;
        }
        interactedRef.current = true;
        const level = map.getLevel();
        fitMap(map, maps, places, FIT_OPTIONS);
        if (map.getLevel() >= level) map.setLevel(level - 1);
      };
      return new maps.CustomOverlay({
        map,
        position: new maps.LatLng(group.lead.latitude, group.lead.longitude),
        content: makePlaceMarkerContent(group, onClick),
        clickable: true,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: places.length > 1 ? 3 : 2,
      });
    });
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
        if (container.isConnected && container.clientWidth > 0) drawMarkers();
      };
      maps.event.addListener(map, 'idle', onIdle);
      const markInteracted = () => {
        interactedRef.current = true;
      };
      container.addEventListener('pointerdown', markInteracted);
      container.addEventListener('wheel', markInteracted);
      const resizeObserver = new ResizeObserver(() => {
        if (!container.isConnected || container.clientWidth === 0 || container.clientHeight === 0)
          return;
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
