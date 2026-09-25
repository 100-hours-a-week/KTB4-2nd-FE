import axios from 'axios';
import { cookies } from 'next/headers';

import type { ApiResponse } from '@/shared/api';
import { createServerApiClient } from '@/shared/api/server';

import type { TripDetail, TripDetailResult } from '../model/types';

type TripDetailRegionResponse = {
  regionId: number;
  regionCode: string;
  regionName: string;
};

type TripDetailApiResponse = {
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

/**
 * 헤더의 여행 이름과 정보를 첫 페인트부터 보여줘야 해서 서버에서 조회합니다.
 * next/headers를 쓰므로 클라이언트 컴포넌트에서 import하면 안 됩니다.
 */
export async function getTripDetail(tripId: number): Promise<TripDetailResult> {
  if (!(await cookies()).has('accessToken')) {
    return { status: 'unauthorized' };
  }

  const client = await createServerApiClient();

  try {
    const { data } = await client.get<ApiResponse<TripDetailApiResponse>>(`/trips/${tripId}`, {
      headers: { 'Cache-Control': 'no-store' },
    });

    return { status: 'ok', trip: toTripDetail(data.data) };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) return { status: 'unauthorized' };
      if (error.response?.status === 404) return { status: 'notFound' };
      if (error.response?.status === 409) return { status: 'notReady' };
    }

    // AxiosError에는 요청의 Cookie 헤더가 들어 있어 서버 로그에 그대로 남기지 않습니다.
    throw new Error('여행 상세를 불러오지 못했습니다.');
  }
}

function toTripDetail(response: TripDetailApiResponse): TripDetail {
  return {
    id: response.tripId,
    name: response.tripName,
    locations: response.regions.map((region) => region.regionName),
    startDate: response.startDate,
    endDate: response.endDate,
    nights: response.nightCount,
    photoCount: response.attachmentCount,
    reviewCount: 0,
  };
}
