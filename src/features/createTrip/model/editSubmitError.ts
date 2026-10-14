import axios from 'axios';

import type { ApiErrorResponse } from '@/shared/api';

import type { TripCreateStep } from './types';

export type TripEditSubmitError = {
  message: string;
  step?: TripCreateStep;
  resetAddition?: boolean;
};

export function getTripEditSubmitError(error: unknown): TripEditSubmitError {
  const code = axios.isAxiosError<ApiErrorResponse>(error)
    ? error.response?.data?.message
    : undefined;

  switch (code) {
    case 'TRIP_NAME_DUPLICATED':
      return { message: '같은 이름의 여행이 이미 있어요.', step: 'name' };
    case 'INVALID_TRIP_REQUEST':
    case 'INVALID_REQUEST':
      return { message: '여행 정보를 다시 확인해주세요.', step: 'name' };
    case 'TRIP_UPDATE_NOT_ALLOWED':
    case 'TRIP_ATTACHMENT_ADD_NOT_ALLOWED':
      return {
        message: '사진을 정리하는 중이라 지금은 수정할 수 없어요. 잠시 후 다시 시도해주세요.',
      };
    case 'INVALID_ATTACHMENT_UPLOAD':
      return { message: '사진을 다시 선택해주세요.', step: 'images', resetAddition: true };
    case 'ATTACHMENT_UPLOAD_LIMIT_EXCEEDED':
      return {
        message: '여행 하나에 사진은 최대 200장, 한 장에 15MB까지 올릴 수 있어요.',
        step: 'images',
        resetAddition: true,
      };
    case 'UNSUPPORTED_ATTACHMENT_FORMAT':
      return { message: 'JPG, PNG, HEIC 형식의 사진만 올릴 수 있어요.', step: 'images' };
    case 'ATTACHMENT_UPLOAD_URL_PROVIDER_UNAVAILABLE':
      return { message: '사진 업로드를 준비하지 못했어요. 잠시 후 다시 시도해주세요.' };
    case 'TRIP_NOT_FOUND':
      return { message: '여행을 찾을 수 없어요.' };
    default:
      return { message: '여행을 수정하지 못했어요. 잠시 후 다시 시도해주세요.' };
  }
}
