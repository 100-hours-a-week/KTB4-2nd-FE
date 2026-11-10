'use client';

import { useSearchParams } from 'next/navigation';
import { useRef } from 'react';

import type { SearchPhoto } from '@/features/search';

const PHOTO_PARAM = 'photo';

export function useSearchPhotoDetail(photos: SearchPhoto[]) {
  const searchParams = useSearchParams();
  const pushedByMe = useRef(false);
  const photoId = Number(searchParams.get(PHOTO_PARAM));
  const openedPhoto = photos.find((photo) => photo.id === photoId) ?? null;

  function urlWith(id: number | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id === null) params.delete(PHOTO_PARAM);
    else params.set(PHOTO_PARAM, String(id));
    const query = params.toString();
    return query ? `?${query}` : window.location.pathname;
  }

  function open(photo: SearchPhoto) {
    pushedByMe.current = true;
    window.history.pushState(null, '', urlWith(photo.id));
  }

  function close() {
    if (pushedByMe.current) {
      pushedByMe.current = false;
      window.history.back();
      return;
    }
    // 상세보기 주소로 바로 들어온 경우에는 되돌아갈 검색 기록이 없어서 주소만 바꿉니다.
    window.history.replaceState(null, '', urlWith(null));
  }

  return { openedPhoto, open, close };
}
