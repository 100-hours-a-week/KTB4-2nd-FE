import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hasAnyPhotoLocation } from './hasAnyPhotoLocation';

const gps = vi.hoisted(() =>
  vi.fn<(file: File) => Promise<{ latitude: number; longitude: number } | undefined>>(),
);
vi.mock('exifr', () => ({ gps, fileParsers: new Map() }));
const files = [new File(['a'], 'a.jpg'), new File(['b'], 'b.heic')];

describe('hasAnyPhotoLocation', () => {
  beforeEach(() => vi.mocked(gps).mockReset());

  it('모든 원본 사진에 GPS가 없을 때만 false를 반환한다', async () => {
    vi.mocked(gps).mockResolvedValue(undefined);
    expect(await hasAnyPhotoLocation(files)).toBe(false);
    expect(gps).toHaveBeenNthCalledWith(1, files[0]);
    expect(gps).toHaveBeenNthCalledWith(2, files[1]);
  });

  it('위치가 있는 한 장을 찾으면 나머지 파일을 읽지 않는다', async () => {
    vi.mocked(gps).mockResolvedValue({ latitude: 0, longitude: 0 });
    expect(await hasAnyPhotoLocation(files)).toBe(true);
    expect(gps).toHaveBeenCalledTimes(1);
  });

  it('위치가 없는 사진과 있는 사진이 섞여 있어도 통과한다', async () => {
    vi.mocked(gps)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ latitude: 37, longitude: 127 });
    expect(await hasAnyPhotoLocation(files)).toBe(true);
  });

  it('좌표가 유효하지 않으면 위치 정보로 인정하지 않는다', async () => {
    vi.mocked(gps)
      .mockResolvedValueOnce({ latitude: NaN, longitude: 127 })
      .mockResolvedValueOnce({ latitude: 37, longitude: 181 });
    expect(await hasAnyPhotoLocation(files)).toBe(false);
  });

  it('읽기 실패가 있더라도 다른 사진에 GPS가 있으면 통과한다', async () => {
    vi.mocked(gps)
      .mockRejectedValueOnce(new Error('Unreadable HEIC'))
      .mockResolvedValueOnce({ latitude: 37, longitude: 127 });
    expect(await hasAnyPhotoLocation(files)).toBe(true);
  });

  it('읽기 실패를 모든 사진의 GPS 없음으로 단정하지 않는다', async () => {
    vi.mocked(gps).mockRejectedValueOnce(new Error('Read error')).mockResolvedValueOnce(undefined);
    await expect(hasAnyPhotoLocation(files)).rejects.toThrow(
      '사진의 위치 정보를 확인하지 못했어요.',
    );
  });
});
