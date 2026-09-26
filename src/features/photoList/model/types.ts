export type PhotoAccent = 'coast' | 'night' | 'blossom' | 'sunset' | 'island' | 'desert';

export type PhotoListItem = {
  id: number;
  thumbnailUrl?: string | null;
  /** 목록 응답에 촬영 일시가 없어 현재는 비어 있습니다. */
  capturedAt?: string | null;
  accent: PhotoAccent;
  loadFailed?: boolean;
};

export type PhotoListViewState = 'ready' | 'loading' | 'error';

/** 일괄 다운로드는 백엔드에서 한 번에 200장까지만 허용합니다. */
export const BULK_DOWNLOAD_LIMIT = 200;
