import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { getTripEditSubmitError } from './editSubmitError';

function apiError(status: number, message: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('failed', undefined, config, null, {
    status,
    statusText: '',
    data: { message, data: null },
    headers: {},
    config,
  });
}

describe('getTripEditSubmitError', () => {
  it.each([
    [415, 'UNSUPPORTED_ATTACHMENT_FORMAT'],
    [400, 'INVALID_ATTACHMENT_UPLOAD'],
    [400, 'SOME_NEW_BAD_REQUEST'],
  ])('사진 추가가 %i(%s)로 거절되면 작업을 초기화해 새로 올리게 한다', (status, code) => {
    expect(getTripEditSubmitError(apiError(status, code)).resetAddition).toBe(true);
  });

  it('415면 지원 형식을 안내하고 사진 단계로 보낸다', () => {
    expect(getTripEditSubmitError(apiError(415, 'UNSUPPORTED_ATTACHMENT_FORMAT'))).toEqual({
      message: 'JPG, PNG, HEIC 형식의 사진만 올릴 수 있어요.',
      step: 'images',
      resetAddition: true,
    });
  });

  it('사진 추가가 409로 막히면 사진 정리나 스토리 생성 중이라고 안내하고 작업은 유지한다', () => {
    const result = getTripEditSubmitError(apiError(409, 'TRIP_ATTACHMENT_ADD_NOT_ALLOWED'));

    expect(result.message).toContain('사진 정리나 스토리 생성이 진행 중이라');
    expect(result.resetAddition).toBeUndefined();
  });
});
