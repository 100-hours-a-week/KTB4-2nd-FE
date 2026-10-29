import type { TripPlaceMarker } from '../model/types';

export type PlaceMarkerGroup = {
  places: TripPlaceMarker[];
  lead: TripPlaceMarker;
};

export function toPlaceMarkerGroup(places: TripPlaceMarker[]): PlaceMarkerGroup {
  return {
    places,
    lead: places.reduce((lead, place) => (place.photoCount > lead.photoCount ? place : lead)),
  };
}

export function makePlaceMarkerContent(group: PlaceMarkerGroup, onClick: () => void) {
  const { lead, places } = group;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'trip-map-marker';
  button.setAttribute(
    'aria-label',
    places.length > 1
      ? `${lead.name} 외 ${places.length - 1}곳 확대해서 보기`
      : `${lead.name} 사진 ${lead.photoCount}장 보기`,
  );

  const pin = document.createElement('span');
  pin.className = 'trip-map-pin';
  if (lead.thumbnailUrl) {
    pin.classList.add('is-loading');
    const image = document.createElement('img');
    image.alt = '';
    image.onload = () => pin.classList.remove('is-loading');
    image.onerror = () => {
      pin.classList.remove('is-loading');
      image.remove();
    };
    image.src = lead.thumbnailUrl;
    pin.append(image);
  }
  button.append(pin);

  if (places.length > 1) {
    const count = document.createElement('span');
    count.className = 'trip-map-count';
    count.textContent = places.length >= 99 ? '99+' : String(places.length);
    button.append(count);
  }

  button.addEventListener('click', onClick);
  return button;
}
