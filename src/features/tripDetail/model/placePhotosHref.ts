export function placePhotosHref(
  trip: { id: number; name: string },
  place: { id: number; name: string },
) {
  return `/trips/${trip.id}/places/${place.id}/photos?place=${encodeURIComponent(place.name)}&trip=${encodeURIComponent(trip.name)}`;
}
