export type TripMapMarker = {
  tripId: number;
  title: string;
  latitude: number;
  longitude: number;
  regionName: string;
  thumbnailUrl?: string | null;
  createdAt?: string;
};

export type TripMarkerGroup = {
  trips: TripMapMarker[];
  latitude: number;
  longitude: number;
};

export function groupNearbyTripMarkers(
  trips: TripMapMarker[],
  project: (trip: TripMapMarker) => { x: number; y: number },
  radius = 72,
): TripMarkerGroup[] {
  const groups: TripMarkerGroup[] = [];
  const positions = trips.map(project);
  const visited = new Set<number>();

  for (let index = 0; index < trips.length; index += 1) {
    if (visited.has(index)) continue;

    const queue = [index];
    const members: number[] = [];
    visited.add(index);

    while (queue.length > 0) {
      const current = queue.shift()!;
      members.push(current);

      for (let candidate = 0; candidate < trips.length; candidate += 1) {
        if (visited.has(candidate)) continue;
        if (
          Math.hypot(
            positions[current].x - positions[candidate].x,
            positions[current].y - positions[candidate].y,
          ) > radius
        )
          continue;

        visited.add(candidate);
        queue.push(candidate);
      }
    }

    const orderedTrips = members
      .map((member) => trips[member])
      .sort((a, b) => {
        const byDate = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
        return byDate || a.tripId - b.tripId;
      });

    groups.push({
      trips: orderedTrips,
      latitude: orderedTrips[0].latitude,
      longitude: orderedTrips[0].longitude,
    });
  }

  return groups;
}
