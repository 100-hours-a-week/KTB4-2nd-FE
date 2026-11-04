import { useEffect, useRef } from 'react';

type PhotoAutoLoadOptions = {
  enabled: boolean;
  pageCount: number;
  loadNextPage: () => Promise<unknown>;
};

export function usePhotoAutoLoad({ enabled, pageCount, loadNextPage }: PhotoAutoLoadOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled || typeof IntersectionObserver === 'undefined') return;
    let root = sentinel.parentElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY))
      root = root.parentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadNextPage().catch(() => {});
      },
      { root, rootMargin: '400px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, pageCount, loadNextPage]);

  return sentinelRef;
}
