import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { getPhotoDeleteErrorMessage } from './photoDeleteError';

function apiError(status: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('failed', undefined, config, null, {
    status,
    statusText: '',
    data: { message: 'ATTACHMENT_DELETE_NOT_ALLOWED', data: null },
    headers: {},
    config,
  });
}

describe('getPhotoDeleteErrorMessage', () => {
  it('409면 사진 정리 중이라 삭제할 수 없다고 안내한다', () => {
    expect(getPhotoDeleteErrorMessage(apiError(409))).toBe(
      '사진을 정리하는 중이라 지금은 삭제할 수 없어요. 잠시 후 다시 시도해주세요.',
    );
  });

  it('그 밖의 실패는 기존 안내를 쓴다', () => {
    expect(getPhotoDeleteErrorMessage(apiError(500))).toBe('사진을 삭제하지 못했어요.');
  });
});
