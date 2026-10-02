import type { TripCreateFormValues } from './types';

export function getTripRegion(places: TripCreateFormValues['places']) {
  const regionName = places[0]?.regionName.trim();
  if (!regionName) return 'unknown';

  const units = regionName.split(/\s+/);
  for (let index = units.length - 1; index >= 0; index -= 1) {
    if (/[시군구]$/.test(units[index])) return units[index];
  }

  return regionName;
}
