import type { KakaoMap, KakaoMaps } from './kakaoMaps';
import { getTripMarkerThumbnail, type TripMarkerGroup } from '../model/tripMapMarker';

export const KOREA_BOUNDS = { south: 33.05, west: 124.55, north: 38.65, east: 131.9 };
export const KOREA_CENTER = { latitude: 35.85, longitude: 128.2 };

type MapPosition = { latitude: number; longitude: number };

export function isValidPosition(trip: MapPosition) {
  return (
    Number.isFinite(trip.latitude) &&
    Number.isFinite(trip.longitude) &&
    trip.latitude >= -90 &&
    trip.latitude <= 90 &&
    trip.longitude >= -180 &&
    trip.longitude <= 180
  );
}

export type FitMapOptions = {
  padding?: [top: number, right: number, bottom: number, left: number];
  singleLevel?: number;
};

export function fitMap(
  map: KakaoMap,
  maps: KakaoMaps,
  trips: MapPosition[],
  { padding = [16, 16, 112, 16], singleLevel = 13 }: FitMapOptions = {},
) {
  if (
    trips.length === 1 ||
    (trips.length > 1 &&
      trips.every(
        (trip) => trip.latitude === trips[0].latitude && trip.longitude === trips[0].longitude,
      ))
  ) {
    map.setCenter(new maps.LatLng(trips[0].latitude, trips[0].longitude));
    map.setLevel(singleLevel);
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
  map.setBounds(bounds, ...padding);
}

// Kakao CustomOverlay는 React 요소가 아닌 DOM content를 받는다.
export function makeMarkerContent(group: TripMarkerGroup, onClick: (marker: HTMLElement) => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'trip-map-marker';
  if (group.tripCount > 1) button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute(
    'aria-label',
    group.tripCount === 1 && group.trips[0]
      ? `${group.trips[0].tripName} 여행 보기`
      : `겹친 여행 ${group.tripCount}개 보기`,
  );
  const pin = document.createElement('span');
  pin.className = 'trip-map-pin';
  const thumbnail = getTripMarkerThumbnail(group);
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
  if (group.tripCount > 1) {
    const count = document.createElement('span');
    count.className = 'trip-map-count';
    count.textContent = group.tripCount >= 99 ? '99+' : String(group.tripCount);
    button.append(count);
  }
  button.addEventListener('click', () => onClick(button));
  return button;
}
