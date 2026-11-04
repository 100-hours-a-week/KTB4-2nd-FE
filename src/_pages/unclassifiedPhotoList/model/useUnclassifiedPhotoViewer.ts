import { useEffect, useRef, useState } from 'react';

import type { UnclassifiedPhoto } from '@/features/unclassifiedPhotos';
import { toast } from '@/shared/ui/toast';

type PhotoViewerOptions = {
  photos: UnclassifiedPhoto[];
  hasNextPage: boolean;
  loadNextPage: () => Promise<UnclassifiedPhoto[]>;
};

export function useUnclassifiedPhotoViewer({
  photos,
  hasNextPage,
  loadNextPage,
}: PhotoViewerOptions) {
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);
  const [navigationPending, setNavigationPending] = useState(false);
  const navigationRequest = useRef(0);
  const activeIndex = photos.findIndex((photo) => photo.id === activePhotoId);
  const activePhoto = photos[activeIndex];

  useEffect(
    () => () => {
      navigationRequest.current++;
    },
    [],
  );

  function openPhoto(id: number | null) {
    navigationRequest.current++;
    setNavigationPending(false);
    setActivePhotoId(id);
  }

  async function nextPhoto() {
    if (navigationPending || activePhotoId === null) return;
    if (activeIndex < photos.length - 1) {
      openPhoto(photos[activeIndex + 1].id);
      return;
    }
    if (!hasNextPage) {
      openPhoto(photos[0].id);
      return;
    }
    const token = ++navigationRequest.current;
    const currentId = activePhotoId;
    setNavigationPending(true);
    try {
      const nextPhotos = await loadNextPage();
      if (navigationRequest.current !== token) return;
      const index = nextPhotos.findIndex((photo) => photo.id === currentId);
      const next = nextPhotos[index + 1];
      if (index >= 0 && next) setActivePhotoId(next.id);
    } catch {
      if (navigationRequest.current === token)
        toast.error('다음 사진을 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      if (navigationRequest.current === token) setNavigationPending(false);
    }
  }

  return {
    activePhoto,
    activeIndex,
    isOpen: activePhotoId !== null,
    navigationPending,
    openPhoto,
    closePhoto: () => openPhoto(null),
    previousPhoto: () => openPhoto(photos[(activeIndex - 1 + photos.length) % photos.length].id),
    nextPhoto,
  };
}
