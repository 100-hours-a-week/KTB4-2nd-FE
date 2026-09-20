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

export type ImageSelectionResult = { ok: true; files: File[] } | { ok: false; message: string };

/** 새로 선택한 묶음 전체를 검사하고 하나라도 잘못되면 기존 목록을 유지합니다. */
export function validateImageSelection(
  existingFiles: File[],
  selectedFiles: File[],
): ImageSelectionResult {
  if (existingFiles.length + selectedFiles.length > TRIP_IMAGE_MAX_COUNT) {
    return {
      ok: false,
      message: `사진은 최대 ${TRIP_IMAGE_MAX_COUNT}장까지 선택할 수 있어요.`,
    };
  }

  const unsupportedFile = selectedFiles.find((file) => !isSupportedImage(file));
  if (unsupportedFile) {
    return { ok: false, message: 'JPG, PNG, HEIC 형식의 사진만 선택할 수 있어요.' };
  }

  const oversizedFile = selectedFiles.find((file) => file.size > TRIP_IMAGE_MAX_SIZE);
  if (oversizedFile) {
    return { ok: false, message: '사진 한 장의 용량은 15MB를 넘을 수 없어요.' };
  }

  const totalSize = [...existingFiles, ...selectedFiles].reduce((sum, file) => sum + file.size, 0);
  if (totalSize > TRIP_IMAGE_MAX_TOTAL_SIZE) {
    return { ok: false, message: '선택한 사진의 전체 용량은 3GB를 넘을 수 없어요.' };
  }

  return { ok: true, files: [...existingFiles, ...selectedFiles] };
}
