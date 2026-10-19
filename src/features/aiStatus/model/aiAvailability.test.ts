import { describe, expect, it } from 'vitest';

import { toAiAvailability } from './aiAvailability';

describe('toAiAvailability', () => {
  it.each([
    [{ running: false, ready: false }, 'off'],
    [{ running: true, ready: false }, 'starting'],
    [{ running: true, ready: true }, 'ready'],
    [{ running: null, ready: true }, 'ready'],
    [{ running: null, ready: false }, 'off'],
  ] as const)('%o이면 %s로 판단한다', (status, expected) => {
    expect(toAiAvailability(status)).toBe(expected);
  });
});
