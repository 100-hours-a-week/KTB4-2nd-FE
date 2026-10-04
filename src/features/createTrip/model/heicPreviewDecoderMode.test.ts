import { afterEach, expect, it, vi } from 'vitest';

import { getHeicPreviewDecoderMode } from './heicPreviewDecoderMode';

afterEach(() => vi.unstubAllEnvs());

it.each(['development', 'production', 'test'])(
  '%s 환경의 실험 기본값을 사용한다',
  (environment) => {
    vi.stubEnv('NODE_ENV', environment);
    vi.stubEnv('NEXT_PUBLIC_HEIC_PREVIEW_DECODER', undefined);
    expect(getHeicPreviewDecoderMode()).toBe(environment === 'development' ? 'wasm' : 'js');
  },
);

it.each(['js', 'wasm'] as const)('명시한 %s 디코더를 환경과 관계없이 선택한다', (decoder) => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_HEIC_PREVIEW_DECODER', decoder);
  expect(getHeicPreviewDecoderMode()).toBe(decoder);
});
