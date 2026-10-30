import { useEffect, useRef, useState } from 'react';

import type { UnclassifiedPhoto } from '@/features/unclassifiedPhotos';
import { toast } from '@/shared/ui/toast';

type PhotoSelectionOptions = {
  photos: UnclassifiedPhoto[];
  hasNextPage: boolean;
  loadAllPhotos: (signal: AbortSignal) => Promise<UnclassifiedPhoto[]>;
};

export function useUnclassifiedPhotoSelection({
  photos,
  hasNextPage,
  loadAllPhotos,
}: PhotoSelectionOptions) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const selectionRequest = useRef<AbortController | null>(null);
  const selectedPhotos = photos.filter((photo) => selectedIds.has(photo.id));
  const selectedCount = selectedPhotos.length;
  const allSelected = !hasNextPage && photos.length > 0 && selectedCount === photos.length;

  useEffect(() => () => selectionRequest.current?.abort(), []);

  function cancelSelectAll() {
    selectionRequest.current?.abort();
    selectionRequest.current = null;
    setIsSelectingAll(false);
  }

  async function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    if (!hasNextPage) {
      setSelectedIds(new Set(photos.map((photo) => photo.id)));
      return;
    }
    if (selectionRequest.current) return;
    const controller = new AbortController();
    selectionRequest.current = controller;
    setIsSelectingAll(true);
    try {
      const allPhotos = await loadAllPhotos(controller.signal);
      if (!controller.signal.aborted) setSelectedIds(new Set(allPhotos.map((photo) => photo.id)));
    } catch {
      if (!controller.signal.aborted)
        toast.error('전체 사진을 불러오지 못했어요. 기존 선택은 유지됩니다.');
    } finally {
      if (selectionRequest.current === controller) {
        selectionRequest.current = null;
        setIsSelectingAll(false);
      }
    }
  }

  function leaveSelectionMode() {
    cancelSelectAll();
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function togglePhoto(photoId: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  return {
    selectionMode,
    selectedIds,
    selectedPhotos,
    selectedCount,
    allSelected,
    isSelectingAll,
    enterSelectionMode: () => setSelectionMode(true),
    leaveSelectionMode,
    togglePhoto,
    toggleAll,
    cancelSelectAll,
  };
}
