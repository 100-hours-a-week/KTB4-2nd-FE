export type TripMapTrip = {
  tripId: number;
  tripName: string;
  thumbnailUrl: string | null;
  attachmentCount: number;
};

export type TripMapMarker = {
  regionCode: string;
  regionName: string;
  latitude: number;
  longitude: number;
  tripCount: number;
  trips: TripMapTrip[];
};

export type TripMarkerGroup = {
  markers: TripMapMarker[];
  trips: TripMapTrip[];
  tripCount: number;
  regionName: string;
  latitude: number;
  longitude: number;
};

export function groupNearbyTripMarkers(
  markers: TripMapMarker[],
  project: (marker: TripMapMarker) => { x: number; y: number },
  radius = 72,
): TripMarkerGroup[] {
  const groups: TripMarkerGroup[] = [];
  const positions = markers.map(project);
  const visited = new Set<number>();

  for (let index = 0; index < markers.length; index += 1) {
    if (visited.has(index)) continue;

    const queue = [index];
    const members: number[] = [];
    visited.add(index);

    while (queue.length > 0) {
      const current = queue.shift()!;
      members.push(current);

      for (let candidate = 0; candidate < markers.length; candidate += 1) {
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

    const groupedMarkers = members.map((member) => markers[member]);

    groups.push({
      markers: groupedMarkers,
      trips: groupedMarkers.flatMap((marker) => marker.trips),
      tripCount: groupedMarkers.reduce((count, marker) => count + marker.tripCount, 0),
      regionName: groupedMarkers[0].regionName,
      latitude: groupedMarkers[0].latitude,
      longitude: groupedMarkers[0].longitude,
    });
  }

  return groups;
}
