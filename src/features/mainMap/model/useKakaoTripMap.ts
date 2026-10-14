import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from '@/shared/ui/toast';

import type { KakaoCustomOverlay, KakaoMap } from '../lib/kakaoMaps';
import {
  fitMap,
  isValidPosition,
  KOREA_BOUNDS,
  KOREA_CENTER,
  makeMarkerContent,
} from '../lib/tripMapView';
import { groupNearbyTripMarkers, type TripMapMarker, type TripMarkerGroup } from './tripMapMarker';

type Viewport = { latitude: number; longitude: number; level: number };
type UseKakaoTripMapOptions = {
  trips: TripMapMarker[];
  onTripSelect: (tripId: number) => void;
  resetSignal: number;
  onGroupOpen: (
    group: TripMarkerGroup,
    point: { x: number; y: number },
    marker: HTMLElement,
    container: HTMLElement,
  ) => void;
  onGroupDismiss: () => void;
};
let rememberedViewport: Viewport | null = null;
let preloadedThumbnails = new Map<string, HTMLImageElement>();

export function forgetMapViewport() {
  rememberedViewport = null;
}

function preloadMarkerThumbnails(trips: TripMapMarker[]) {
  const next = new Map<string, HTMLImageElement>();
  trips.forEach((trip) => {
    const url = trip.trips.find((item) => item.thumbnailUrl)?.thumbnailUrl;
    if (!url || next.has(url)) return;
    let image = preloadedThumbnails.get(url);
    if (!image) {
      image = new Image();
      image.decoding = 'async';
      image.src = url;
    }
    next.set(url, image);
  });
  preloadedThumbnails = next;
}

export function useKakaoTripMap({
  trips,
  onTripSelect,
  resetSignal,
  onGroupOpen,
  onGroupDismiss,
}: UseKakaoTripMapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const tripsRef = useRef(trips);
  const onTripSelectRef = useRef(onTripSelect);
  const interactedRef = useRef(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const onSdkError = useCallback(() => {
    setMapStatus('error');
    toast.error('지도 로드에 실패했어요.');
  }, []);
  const onSdkReady = useCallback(() => {
    if (window.kakao?.maps) setSdkReady(true);
    else onSdkError();
  }, [onSdkError]);

  useEffect(() => {
    tripsRef.current = trips;
  }, [trips]);
  useEffect(() => {
    onTripSelectRef.current = onTripSelect;
  }, [onTripSelect]);

  const drawMarkers = useCallback(() => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    const projection = map.getProjection();
    const groups = groupNearbyTripMarkers(tripsRef.current.filter(isValidPosition), (trip) =>
      projection.containerPointFromCoords(new maps.LatLng(trip.latitude, trip.longitude)),
    );
    overlaysRef.current = groups.map((group) => {
      const position = new maps.LatLng(group.latitude, group.longitude);
      const content = makeMarkerContent(group, (marker) => {
        if (group.tripCount === 1 && group.trips[0]) {
          onTripSelectRef.current(group.trips[0].tripId);
          return;
        }
        const container = containerRef.current;
        if (!container) return;
        onGroupOpen(
          group,
          map.getProjection().containerPointFromCoords(position),
          marker,
          container,
        );
      });
      return new maps.CustomOverlay({
        map,
        position,
        content,
        clickable: true,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: group.tripCount > 1 ? 3 : 2,
      });
    });
  }, [onGroupOpen]);

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
      const validTrips = tripsRef.current.filter(isValidPosition);
      const savedViewport = rememberedViewport;
      const onIdle = () => {
        if (!container.isConnected || container.clientWidth === 0 || container.clientHeight === 0)
          return;
        const center = map.getCenter();
        if (interactedRef.current)
          rememberedViewport = {
            latitude: center.getLat(),
            longitude: center.getLng(),
            level: map.getLevel(),
          };
        onGroupDismiss();
        drawMarkers();
      };
      const onMapClick = () => onGroupDismiss();
      maps.event.addListener(map, 'idle', onIdle);
      maps.event.addListener(map, 'click', onMapClick);
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
        else fitMap(map, maps, tripsRef.current.filter(isValidPosition));
        drawMarkers();
      });
      resizeObserver.observe(container);
      const readyFrame = requestAnimationFrame(() => {
        if (!active || mapRef.current !== map) return;
        map.relayout();
        if (savedViewport) {
          map.setCenter(new maps.LatLng(savedViewport.latitude, savedViewport.longitude));
          map.setLevel(savedViewport.level);
          interactedRef.current = true;
        } else fitMap(map, maps, validTrips);
        drawMarkers();
        setMapStatus('ready');
      });
      if (validTrips.length === 0 && !savedViewport && navigator.permissions) {
        void navigator.permissions
          .query({ name: 'geolocation' })
          .then((permission) => {
            if (!active || permission.state !== 'granted') return;
            navigator.geolocation.getCurrentPosition(({ coords }) => {
              if (!active || interactedRef.current || !mapRef.current) return;
              const { latitude, longitude } = coords;
              if (
                latitude < KOREA_BOUNDS.south ||
                latitude > KOREA_BOUNDS.north ||
                longitude < KOREA_BOUNDS.west ||
                longitude > KOREA_BOUNDS.east
              )
                return;
              map.setCenter(new maps.LatLng(latitude, longitude));
              map.setLevel(12);
            });
          })
          .catch(() => undefined);
      }
      cleanup = () => {
        cancelAnimationFrame(readyFrame);
        resizeObserver.disconnect();
        container.removeEventListener('pointerdown', markInteracted);
        container.removeEventListener('wheel', markInteracted);
        maps.event.removeListener(map, 'idle', onIdle);
        maps.event.removeListener(map, 'click', onMapClick);
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
  }, [sdkReady, drawMarkers, onGroupDismiss]);

  const tripSignature = trips
    .map((trip) =>
      [
        trip.regionCode,
        trip.latitude,
        trip.longitude,
        trip.regionName,
        trip.tripCount,
        ...trip.trips.flatMap((item) => [item.tripId, item.tripName, item.thumbnailUrl]),
      ].join(':'),
    )
    .join('|');

  useEffect(() => {
    preloadMarkerThumbnails(tripsRef.current);
  }, [tripSignature]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    if (!interactedRef.current) fitMap(map, maps, tripsRef.current.filter(isValidPosition));
    drawMarkers();
    onGroupDismiss();
  }, [tripSignature, drawMarkers, onGroupDismiss]);

  useEffect(() => {
    if (resetSignal === 0) return;
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    interactedRef.current = false;
    rememberedViewport = null;
    fitMap(map, maps, tripsRef.current.filter(isValidPosition));
    drawMarkers();
    onGroupDismiss();
  }, [resetSignal, drawMarkers, onGroupDismiss]);

  return { containerRef, mapStatus, onSdkReady, onSdkError };
}
