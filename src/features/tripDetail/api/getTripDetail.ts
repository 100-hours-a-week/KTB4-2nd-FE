import axios from 'axios';
import { cookies } from 'next/headers';

import type { ApiResponse } from '@/shared/api';
import { createServerApiClient } from '@/shared/api/server';

import type { TripDetailResult } from '../model/types';
import { toTripDetail, type TripDetailApiResponse } from './tripDetailResponse';

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

    throw new Error('여행 상세를 불러오지 못했습니다.');
  }
}
