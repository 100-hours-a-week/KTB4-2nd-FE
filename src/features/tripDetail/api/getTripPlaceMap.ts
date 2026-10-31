import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripPlaceMarker } from '../model/types';

type TripPlaceMapMarkerResponse = {
  tripPlaceId: number;
  placeName: string;
  latitude: number;
  longitude: number;
  attachmentCount: number;
  thumbnailUrl: string | null;
};

type TripPlaceMapResponse = {
  tripId: number;
  markers: TripPlaceMapMarkerResponse[];
};

export async function getTripPlaceMap(tripId: number): Promise<TripPlaceMarker[]> {
  const { data } = await apiClient.get<ApiResponse<TripPlaceMapResponse>>(`/trips/${tripId}/map`);

  return data.data.markers.map((marker) => ({
    id: marker.tripPlaceId,
    name: marker.placeName,
    latitude: Number(marker.latitude),
    longitude: Number(marker.longitude),
    photoCount: marker.attachmentCount,
    thumbnailUrl: marker.thumbnailUrl,
  }));
}
