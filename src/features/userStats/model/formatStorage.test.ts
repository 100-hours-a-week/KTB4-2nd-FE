import { describe, expect, it } from 'vitest';

import { formatStorage, getStorageUsagePercent } from './formatStorage';

describe('formatStorage', () => {
  it('1GB 이상은 소수 첫째 자리까지 GB로 보여준다', () => {
    expect(formatStorage(12_400_000_000)).toBe('12.4GB');
    expect(formatStorage(30_000_000_000)).toBe('30GB');
  });

  it('1GB 미만은 MB로 보여준다', () => {
    expect(formatStorage(250_000_000)).toBe('250MB');
  });
});

describe('getStorageUsagePercent', () => {
  it('사용 비율을 0~100 사이로 맞춘다', () => {
    expect(getStorageUsagePercent(12_400_000_000, 30_000_000_000)).toBe(41);
    expect(getStorageUsagePercent(40, 30)).toBe(100);
    expect(getStorageUsagePercent(10, 0)).toBe(0);
  });
});
