import axios from 'axios';

import type { ApiErrorResponse } from '@/shared/api';

export type TripCreateSubmitError = {
  message: string;
  step?: 'name' | 'location' | 'date' | 'images';
  resetTrip?: boolean;
};

export function getTripCreateSubmitError(error: unknown): TripCreateSubmitError {
  const code = axios.isAxiosError<ApiErrorResponse>(error)
    ? error.response?.data?.message
    : undefined;

  switch (code) {
    case 'TRIP_NAME_DUPLICATED':
      return { message: '같은 이름의 여행이 이미 있어요.', step: 'name' };
    case 'INVALID_TRIP_REQUEST':
    case 'INVALID_REQUEST':
      return { message: '여행 정보를 다시 확인해주세요.', step: 'name' };
    case 'INVALID_ATTACHMENT_UPLOAD':
      return { message: '사진을 다시 선택해주세요.', step: 'images' };
    case 'ATTACHMENT_UPLOAD_LIMIT_EXCEEDED':
      return { message: '사진은 최대 200장, 한 장에 15MB까지 올릴 수 있어요.', step: 'images' };
    case 'UNSUPPORTED_ATTACHMENT_FORMAT':
      return { message: 'JPG, PNG, HEIC 형식의 사진만 올릴 수 있어요.', step: 'images' };
    case 'TRIP_NOT_FOUND':
      return { message: '여행을 만들지 못했어요. 다시 시도해주세요.', resetTrip: true };
    case 'TRIP_INITIAL_ATTACHMENT_UPLOAD_NOT_ALLOWED':
      return { message: '이미 사진을 정리했거나 정리 중인 여행이에요.' };
    default:
      return { message: '사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.' };
  }
}
