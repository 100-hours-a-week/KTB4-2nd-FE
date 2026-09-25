export const TRIP_IMAGE_MAX_COUNT = 200;
export const TRIP_IMAGE_MAX_SIZE = 15 * 1024 * 1024;
export const TRIP_IMAGE_MAX_TOTAL_SIZE = 3 * 1024 * 1024 * 1024;

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif']);
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];

function isSupportedImage(file: File) {
  const lowerName = file.name.toLowerCase();
  return (
    SUPPORTED_MIME_TYPES.has(file.type.toLowerCase()) ||
    SUPPORTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  );
}

export type ImageSelectionResult =
  { ok: true; files: File[]; duplicateCount: number } | { ok: false; message: string };

function getFileIdentity(file: File) {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}`;
}

function removeDuplicateImages(files: File[]) {
  const identities = new Set<string>();
  return files.filter((file) => {
    const identity = getFileIdentity(file);
    if (identities.has(identity)) return false;
    identities.add(identity);
    return true;
  });
}

export function validateImageSelection(
  existingFiles: File[],
  selectedFiles: File[],
): ImageSelectionResult {
  const unsupportedFile = selectedFiles.find((file) => !isSupportedImage(file));
  if (unsupportedFile) {
    return { ok: false, message: 'JPG, PNG, HEIC 형식의 사진만 선택할 수 있어요.' };
  }

  const oversizedFile = selectedFiles.find((file) => file.size > TRIP_IMAGE_MAX_SIZE);
  if (oversizedFile) {
    return { ok: false, message: '사진 한 장의 용량은 15MB를 넘을 수 없어요.' };
  }

  const allFiles = [...existingFiles, ...selectedFiles];
  const files = removeDuplicateImages(allFiles);
  const duplicateCount = allFiles.length - files.length;

  if (files.length > TRIP_IMAGE_MAX_COUNT) {
    return {
      ok: false,
      message: `사진은 최대 ${TRIP_IMAGE_MAX_COUNT}장까지 선택할 수 있어요.`,
    };
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > TRIP_IMAGE_MAX_TOTAL_SIZE) {
    return { ok: false, message: '선택한 사진의 전체 용량은 3GB를 넘을 수 없어요.' };
  }

  return { ok: true, files, duplicateCount };
}
