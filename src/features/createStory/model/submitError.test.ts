import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { getStoryCreateSubmitError, STORY_NOT_ALLOWED_MESSAGE } from './submitError';

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

describe('getStoryCreateSubmitError', () => {
  it('사진 정리 중이라 거절되면 정리 중 안내를 하고 선택은 그대로 둔다', () => {
    expect(getStoryCreateSubmitError(apiError(409, 'STORY_GENERATION_NOT_ALLOWED'))).toEqual({
      kind: 'retry',
      message: STORY_NOT_ALLOWED_MESSAGE,
    });
  });
});
