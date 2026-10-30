import type { TripPlaceMarker } from '../model/types';

/** 화면상 거리가 아닌 원래 좌표가 정확히 같은 장소만 묶습니다. */
export function groupPlacesAtSamePosition(places: TripPlaceMarker[]): TripPlaceMarker[][] {
  const groups = new Map<string, TripPlaceMarker[]>();
  places.forEach((place) => {
    const key = JSON.stringify([place.latitude, place.longitude]);
    const group = groups.get(key);
    if (group) group.push(place);
    else groups.set(key, [place]);
  });
  return [...groups.values()];
}

export function makePlaceMarkerContent(place: TripPlaceMarker, onClick: () => void, count = 1) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'trip-map-marker';
  button.setAttribute(
    'aria-label',
    count > 1
      ? `같은 위치의 장소 ${count}곳 보기`
      : `${place.name} 사진 ${place.photoCount}장 보기`,
  );
  if (count > 1) button.setAttribute('aria-haspopup', 'dialog');

  const pin = document.createElement('span');
  pin.className = 'trip-map-pin';
  if (place.thumbnailUrl) {
    pin.classList.add('is-loading');
    const image = document.createElement('img');
    image.alt = '';
    image.onload = () => pin.classList.remove('is-loading');
    image.onerror = () => {
      pin.classList.remove('is-loading');
      image.remove();
    };
    image.src = place.thumbnailUrl;
    pin.append(image);
  }
  button.append(pin);

  if (count > 1) {
    const badge = document.createElement('span');
    badge.className = 'trip-map-count';
    badge.textContent = String(count);
    badge.setAttribute('aria-hidden', 'true');
    button.append(badge);
  }
  button.addEventListener('click', onClick);
  return button;
}
