import { registerHeicParser } from './registerHeicParser';

export async function hasAnyPhotoLocation(files: File[]): Promise<boolean> {
  const { gps, fileParsers } = await import('exifr');
  registerHeicParser(fileParsers);
  let readFailed = false;

  for (const file of files) {
    try {
      const location = await gps(file);
      if (
        typeof location?.latitude === 'number' &&
        Number.isFinite(location.latitude) &&
        Math.abs(location.latitude) <= 90 &&
        typeof location?.longitude === 'number' &&
        Number.isFinite(location.longitude) &&
        Math.abs(location.longitude) <= 180
      ) {
        return true;
      }
    } catch {
      readFailed = true;
    }
  }

  if (readFailed) throw new Error('사진의 위치 정보를 확인하지 못했어요.');
  return false;
}
