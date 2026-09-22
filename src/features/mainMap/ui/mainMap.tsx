'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState, type UIEvent } from 'react';

import { toast } from '@/shared/ui/toast';

import type { KakaoCustomOverlay, KakaoMap, KakaoMaps } from '../lib/kakaoMaps';
import {
  groupNearbyTripMarkers,
  type TripMapMarker,
  type TripMarkerGroup,
} from '../model/tripMapMarker';

const KOREA_BOUNDS = { south: 33.05, west: 124.55, north: 38.65, east: 131.9 };
const KOREA_CENTER = { latitude: 35.85, longitude: 128.2 };
const MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;

type Viewport = { latitude: number; longitude: number; level: number };
type OpenGroup = { group: TripMarkerGroup; x: number; y: number; placement: 'above' | 'below' };

let rememberedViewport: Viewport | null = null;

export function forgetMapViewport() {
  rememberedViewport = null;
}

function isValidPosition(trip: TripMapMarker) {
  return (
    Number.isFinite(trip.latitude) &&
    Number.isFinite(trip.longitude) &&
    trip.latitude >= -90 &&
    trip.latitude <= 90 &&
    trip.longitude >= -180 &&
    trip.longitude <= 180
  );
}

function fitMap(map: KakaoMap, maps: KakaoMaps, trips: TripMapMarker[]) {
  if (
    trips.length === 1 ||
    (trips.length > 1 &&
      trips.every(
        (trip) => trip.latitude === trips[0].latitude && trip.longitude === trips[0].longitude,
      ))
  ) {
    map.setCenter(new maps.LatLng(trips[0].latitude, trips[0].longitude));
    map.setLevel(13);
    return;
  }

  const bounds =
    trips.length === 0
      ? new maps.LatLngBounds(
          new maps.LatLng(KOREA_BOUNDS.south, KOREA_BOUNDS.west),
          new maps.LatLng(KOREA_BOUNDS.north, KOREA_BOUNDS.east),
        )
      : new maps.LatLngBounds();

  trips.forEach((trip) => bounds.extend(new maps.LatLng(trip.latitude, trip.longitude)));
  map.setBounds(bounds, 16, 16, 112, 16);
}

function makeMarkerContent(group: TripMarkerGroup, onClick: () => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'trip-map-marker';
  button.setAttribute(
    'aria-label',
    group.tripCount === 1 && group.trips[0]
      ? `${group.trips[0].tripName} 여행 보기`
      : `겹친 여행 ${group.tripCount}개 보기`,
  );

  const pin = document.createElement('span');
  pin.className = 'trip-map-pin';
  const thumbnail = group.trips[0]?.thumbnailUrl;
  if (thumbnail) {
    const image = document.createElement('img');
    image.src = thumbnail;
    image.alt = '';
    image.onerror = () => {
      image.remove();
    };
    pin.append(image);
  }
  button.append(pin);

  const label = document.createElement('span');
  label.className = 'trip-map-region';
  label.textContent = group.regionName;
  button.append(label);

  if (group.tripCount > 1) {
    const count = document.createElement('span');
    count.className = 'trip-map-count';
    count.textContent = group.tripCount >= 99 ? '99+' : String(group.tripCount);
    button.append(count);
  }

  button.addEventListener('click', onClick);
  return button;
}

export function MainMap({
  trips,
  onTripSelect,
  resetSignal = 0,
}: {
  trips: TripMapMarker[];
  onTripSelect: (tripId: number) => void;
  resetSignal?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const tripsRef = useRef(trips);
  const onTripSelectRef = useRef(onTripSelect);
  const interactedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [openGroup, setOpenGroup] = useState<OpenGroup | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

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

    const validTrips = tripsRef.current.filter(isValidPosition);
    const projection = map.getProjection();
    const groups = groupNearbyTripMarkers(validTrips, (trip) =>
      projection.containerPointFromCoords(new maps.LatLng(trip.latitude, trip.longitude)),
    );

    overlaysRef.current = groups.map((group) => {
      const position = new maps.LatLng(group.latitude, group.longitude);
      const content = makeMarkerContent(group, () => {
        if (group.tripCount === 1 && group.trips[0]) {
          onTripSelectRef.current(group.trips[0].tripId);
          return;
        }

        const point = map.getProjection().containerPointFromCoords(position);
        setVisibleCount(5);
        const width = containerRef.current?.clientWidth ?? 208;
        setOpenGroup({
          group,
          x: Math.min(Math.max(point.x, 104), width - 104),
          y: point.y < 260 ? point.y + 16 : point.y - 86,
          placement: point.y < 260 ? 'below' : 'above',
        });
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
  }, []);

  useEffect(() => {
    if (!sdkReady || !containerRef.current) return;
    let active = true;
    const maps = window.kakao?.maps;
    if (!maps) return;

    maps.load(() => {
      if (!active || !containerRef.current) return;

      const map = new maps.Map(containerRef.current, {
        center: new maps.LatLng(KOREA_CENTER.latitude, KOREA_CENTER.longitude),
        level: 12,
      });
      mapRef.current = map;
      map.setMinLevel(1);
      map.setMaxLevel(14);

      const validTrips = tripsRef.current.filter(isValidPosition);
      const savedViewport = rememberedViewport;
      if (savedViewport) {
        map.setCenter(new maps.LatLng(savedViewport.latitude, savedViewport.longitude));
        map.setLevel(savedViewport.level);
        interactedRef.current = true;
      } else {
        fitMap(map, maps, validTrips);
      }

      const onIdle = () => {
        const center = map.getCenter();
        rememberedViewport = {
          latitude: center.getLat(),
          longitude: center.getLng(),
          level: map.getLevel(),
        };
        setOpenGroup(null);
        drawMarkers();
      };
      const onMapClick = () => setOpenGroup(null);
      maps.event.addListener(map, 'idle', onIdle);
      maps.event.addListener(map, 'click', onMapClick);
      drawMarkers();
      setMapStatus('ready');

      const container = containerRef.current;
      const markInteracted = () => {
        interactedRef.current = true;
      };
      container.addEventListener('pointerdown', markInteracted);
      container.addEventListener('wheel', markInteracted);
      const resizeObserver = new ResizeObserver(() => {
        const center = map.getCenter();
        map.relayout();
        if (interactedRef.current) map.setCenter(center);
        else fitMap(map, maps, tripsRef.current.filter(isValidPosition));
        drawMarkers();
      });
      resizeObserver.observe(container);

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

      cleanupRef.current = () => {
        resizeObserver.disconnect();
        container.removeEventListener('pointerdown', markInteracted);
        container.removeEventListener('wheel', markInteracted);
        maps.event.removeListener(map, 'idle', onIdle);
        maps.event.removeListener(map, 'click', onMapClick);
      };
    });

    return () => {
      active = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
    };
  }, [sdkReady, drawMarkers]);

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
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    if (!interactedRef.current) fitMap(map, maps, tripsRef.current.filter(isValidPosition));
    drawMarkers();
    setOpenGroup(null);
  }, [tripSignature, drawMarkers]);

  useEffect(() => {
    if (resetSignal === 0) return;
    const map = mapRef.current;
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    interactedRef.current = false;
    rememberedViewport = null;
    fitMap(map, maps, tripsRef.current.filter(isValidPosition));
    drawMarkers();
    setOpenGroup(null);
  }, [resetSignal, drawMarkers]);

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 24) {
      setVisibleCount((count) => count + 5);
    }
  };

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
          onReady={() => {
            if (window.kakao?.maps) setSdkReady(true);
            else {
              setMapStatus('error');
              toast.error('지도 로드에 실패했어요.');
            }
          }}
          onError={() => {
            setMapStatus('error');
            toast.error('지도 로드에 실패했어요.');
          }}
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

      {openGroup && (
        <div
          className={`absolute z-30 w-48 -translate-x-1/2 overflow-hidden rounded-xl bg-white p-1 shadow-xl ${openGroup.placement === 'above' ? '-translate-y-full' : ''}`}
          style={{
            left: openGroup.x,
            top: openGroup.y,
          }}
        >
          <div
            className={`overflow-y-auto ${openGroup.group.trips.length > visibleCount ? 'h-40' : 'max-h-56'}`}
            onScroll={handleListScroll}
          >
            {openGroup.group.trips.slice(0, visibleCount).map((trip) => (
              <button
                key={trip.tripId}
                type="button"
                className="block min-h-10 w-full truncate rounded-lg px-3 py-2 text-left text-sm text-brand hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand"
                onClick={() => onTripSelect(trip.tripId)}
              >
                {trip.tripName}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
