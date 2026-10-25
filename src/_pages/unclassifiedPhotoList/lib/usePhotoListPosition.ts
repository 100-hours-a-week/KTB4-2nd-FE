'use client';

import { useLayoutEffect, useRef } from 'react';

import type { UnclassifiedPhoto } from '@/features/unclassifiedPhotos';

export function usePhotoListPosition(photos: UnclassifiedPhoto[], processing: boolean) {
  const mainRef = useRef<HTMLElement>(null);
  const pending = useRef<{
    root: HTMLElement;
    photoId?: string;
    offset?: number;
    scrollTop: number;
    minHeight: string;
    userMoved: boolean;
    detach: () => void;
  } | null>(null);

  function capture(removedIds: number[]) {
    const main = mainRef.current;
    if (!main) return;
    pending.current?.detach();
    let root = main.parentElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY))
      root = root.parentElement;
    root ??= document.scrollingElement as HTMLElement;
    if (!root) return;
    const top = root === document.scrollingElement ? 0 : root.getBoundingClientRect().top;
    const bottom =
      root === document.scrollingElement ? window.innerHeight : root.getBoundingClientRect().bottom;
    const removed = new Set(removedIds);
    const anchor = [...main.querySelectorAll<HTMLElement>('[data-photo-id]')].find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        !removed.has(Number(element.dataset.photoId)) && rect.top >= top + 72 && rect.top < bottom
      );
    });
    const markMoved = () => {
      if (pending.current) pending.current.userMoved = true;
    };
    root.addEventListener('wheel', markMoved, { passive: true });
    root.addEventListener('touchstart', markMoved, { passive: true });
    root.addEventListener('pointerdown', markMoved, { passive: true });
    pending.current = {
      root,
      photoId: anchor?.dataset.photoId,
      offset: anchor?.getBoundingClientRect().top,
      scrollTop: root.scrollTop,
      minHeight: pending.current?.minHeight ?? main.style.minHeight,
      userMoved: false,
      detach: () => {
        root.removeEventListener('wheel', markMoved);
        root.removeEventListener('touchstart', markMoved);
        root.removeEventListener('pointerdown', markMoved);
      },
    };
    main.style.minHeight = `${main.getBoundingClientRect().height}px`;
  }

  useLayoutEffect(() => {
    if (processing || !pending.current || !mainRef.current) return;
    const saved = pending.current;
    const main = mainRef.current;
    main.style.minHeight = saved.minHeight;
    if (!saved.userMoved) {
      const anchor = saved.photoId
        ? main.querySelector<HTMLElement>(`[data-photo-id="${saved.photoId}"]`)
        : null;
      if (anchor && saved.offset !== undefined)
        saved.root.scrollTop += anchor.getBoundingClientRect().top - saved.offset;
      else saved.root.scrollTop = saved.scrollTop;
    }
    saved.detach();
    pending.current = null;
  }, [photos, processing]);

  useLayoutEffect(() => () => pending.current?.detach(), []);
  return { mainRef, capture };
}
