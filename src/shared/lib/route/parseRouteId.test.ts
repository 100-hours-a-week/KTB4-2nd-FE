import { describe, expect, it } from 'vitest';

import { parseRouteId } from './parseRouteId';

describe('parseRouteId', () => {
  it('10진수 양의 정수만 ID로 읽는다', () => {
    expect(parseRouteId('7')).toBe(7);
    expect(parseRouteId('120')).toBe(120);
  });

  it.each(['0x10', '1e2', '001', '0', '-1', '1.5', ' 1', '', '99999999999999999999'])(
    '%s처럼 숫자로 바뀌어도 정상 ID가 아닌 값은 거절한다',
    (value) => {
      expect(parseRouteId(value)).toBeNull();
    },
  );
});
