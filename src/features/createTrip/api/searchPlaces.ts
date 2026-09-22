import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { PlaceCandidate } from '../model/types';

type PlaceCandidatesResponse = {
  items: PlaceCandidate[];
};

export async function searchPlaces(query: string): Promise<PlaceCandidate[]> {
  const { data } = await apiClient.get<ApiResponse<PlaceCandidatesResponse>>('/places', {
    params: { query },
  });

  return data.data.items;
}
