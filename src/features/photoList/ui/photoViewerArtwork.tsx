'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type ArtworkState = {
  requestKey: string;
  status: 'ready' | 'failed';
};

export function markPhotoViewer(event: string) {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(`photo-viewer:${event}`);
  }
}

export function PhotoViewerArtwork({
  photoId,
  thumbnailUrl,
  originalUrl,
  originalFailed,
  placeholder,
}: {
  photoId: number;
  thumbnailUrl?: string | null;
  originalUrl: string | null;
  originalFailed: boolean;
  placeholder: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);
  const displayedRef = useRef<{
    photoId: number;
    thumbnailUrl: string | null | undefined;
    url: string;
    kind: 'thumbnail' | 'original';
  } | null>(null);
  const [state, setState] = useState<ArtworkState | null>(null);
  const requestKey = JSON.stringify([photoId, thumbnailUrl, originalUrl, originalFailed]);
  const status = state?.requestKey === requestKey ? state.status : 'pending';

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const generation = ++generationRef.current;
    let active = true;
    const displayed = displayedRef.current;
    const samePhoto = displayed?.photoId === photoId && displayed.thumbnailUrl === thumbnailUrl;
    let originalShown = !!(
      samePhoto &&
      displayed.kind === 'original' &&
      displayed.url === originalUrl
    );
    const thumbnailShown = samePhoto && displayed.kind === 'thumbnail';
    let thumbnailFailed = !thumbnailUrl;
    let fullFailed = originalFailed && !originalUrl;
    const prefix = `${photoId}:${generation}`;
    const isCurrent = () => active && generationRef.current === generation;

    const reportFailure = () => {
      if (!isCurrent() || !thumbnailFailed || !fullFailed) return;
      host.replaceChildren();
      displayedRef.current = null;
      setState({ requestKey, status: 'failed' });
      markPhotoViewer(`${prefix}:failed`);
    };

    const prepare = async (url: string, kind: 'thumbnail' | 'original') => {
      const image = new Image();
      image.alt = '';
      image.className = 'absolute inset-0 size-full object-cover';
      image.decoding = 'async';
      image.src = url;
      markPhotoViewer(`${prefix}:${kind}-url`);
      try {
        await image.decode();
        if (!isCurrent() || (kind === 'thumbnail' && originalShown)) return;
        markPhotoViewer(`${prefix}:${kind}-decoded`);
        if (kind === 'original') originalShown = true;
        host.replaceChildren(image);
        displayedRef.current = { photoId, thumbnailUrl, url, kind };
        setState({ requestKey, status: 'ready' });
        markPhotoViewer(`${prefix}:${kind}-committed`);
      } catch {
        if (!isCurrent()) return;
        if (kind === 'thumbnail') thumbnailFailed = true;
        else fullFailed = true;
        reportFailure();
      }
    };

    if (thumbnailUrl && !thumbnailShown && !originalShown) void prepare(thumbnailUrl, 'thumbnail');
    if (originalUrl && !originalShown) void prepare(originalUrl, 'original');
    if (thumbnailShown || originalShown) {
      void Promise.resolve().then(() => {
        if (isCurrent()) setState({ requestKey, status: 'ready' });
      });
    }
    void Promise.resolve().then(reportFailure);

    return () => {
      active = false;
    };
  }, [photoId, thumbnailUrl, originalUrl, originalFailed, requestKey]);

  return (
    <div className="relative size-full" aria-busy={status === 'pending'}>
      {placeholder}
      <div ref={hostRef} aria-hidden="true" className="absolute inset-0" />
      {status === 'pending' && (
        <span
          role="status"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white"
        >
          사진 불러오는 중…
        </span>
      )}
      {status === 'failed' && (
        <span
          role="status"
          className="absolute inset-0 flex items-center justify-center bg-slate-100 text-sm text-slate-600"
        >
          사진을 불러오지 못했어요
        </span>
      )}
    </div>
  );
}
