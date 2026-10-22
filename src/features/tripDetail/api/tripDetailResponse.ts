import type { TripDetail } from '../model/types';

type TripDetailRegionResponse = {
  regionId: number;
  regionCode: string;
  regionName: string;
};

export type TripDetailApiResponse = {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  nightCount: number;
  regions: TripDetailRegionResponse[];
  attachmentCount: number;
  hasStory: boolean;
  isFavorite: boolean;
};

export function toTripDetail(response: TripDetailApiResponse): TripDetail {
  return {
    id: response.tripId,
    name: response.tripName,
    locations: response.regions.map((region) => region.regionName),
    startDate: response.startDate,
    endDate: response.endDate,
    nights: response.nightCount,
    photoCount: response.attachmentCount,
    reviewCount: 0,
    hasStory: response.hasStory,
  };
}
