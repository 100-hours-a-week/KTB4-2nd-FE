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

export type TripMapApiMarker = {
  tripId: number;
  tripName: string;
  latitude: number;
  longitude: number;
  thumbnailUrl: string | null;
  attachmentCount: number;
};

export function toTripMapMarkers(markers: TripMapApiMarker[]): TripMapMarker[] {
  return markers.map(
    ({ tripId, tripName, latitude, longitude, thumbnailUrl, attachmentCount }) => ({
      regionCode: String(tripId),
      regionName: tripName,
      latitude,
      longitude,
      tripCount: 1,
      trips: [{ tripId, tripName, thumbnailUrl, attachmentCount }],
    }),
  );
}

export function getTripMarkerThumbnail(group: TripMarkerGroup): string | null {
  return group.trips.find((trip) => trip.thumbnailUrl)?.thumbnailUrl ?? null;
}

/** 화면 좌표가 radius 안에 이어지는 항목끼리 묶는다. */
export function clusterNearby<T>(
  items: T[],
  project: (item: T) => { x: number; y: number },
  radius = 72,
): T[][] {
  const clusters: T[][] = [];
  const positions = items.map(project);
  const visited = new Set<number>();

  for (let index = 0; index < items.length; index += 1) {
    if (visited.has(index)) continue;

    const queue = [index];
    const members: number[] = [];
    visited.add(index);

    while (queue.length > 0) {
      const current = queue.shift()!;
      members.push(current);

      for (let candidate = 0; candidate < items.length; candidate += 1) {
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

    clusters.push(members.map((member) => items[member]));
  }

  return clusters;
}

export function groupNearbyTripMarkers(
  markers: TripMapMarker[],
  project: (marker: TripMapMarker) => { x: number; y: number },
  radius = 72,
): TripMarkerGroup[] {
  return clusterNearby(markers, project, radius).map((groupedMarkers) => ({
    markers: groupedMarkers,
    trips: groupedMarkers.flatMap((marker) => marker.trips),
    tripCount: groupedMarkers.reduce((count, marker) => count + marker.tripCount, 0),
    regionName: groupedMarkers[0].regionName,
    latitude: groupedMarkers[0].latitude,
    longitude: groupedMarkers[0].longitude,
  }));
}
