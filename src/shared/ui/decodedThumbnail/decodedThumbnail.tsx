'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Skeleton } from '@/shared/ui/skeleton';

type Props = {
  imageKey: string | number;
  src?: string | null;
  className: string;
  fallback: ReactNode;
  children?: ReactNode;
};

export function DecodedThumbnail(props: Props) {
  return <ThumbnailLayer key={JSON.stringify([props.imageKey, !!props.src])} {...props} />;
}

function ThumbnailLayer({ src, className, fallback, children }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);
  const displayedUrl = useRef<string | null>(null);
  const [settledSrc, setSettledSrc] = useState<string | null>(null);
  const pending = !!src && settledSrc !== src;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const generation = ++generationRef.current;
    let active = true;
    const isCurrent = () => active && generationRef.current === generation;
    if (!src) {
      host.replaceChildren();
      displayedUrl.current = null;
      return () => {
        active = false;
      };
    }
    if (displayedUrl.current === src) {
      void Promise.resolve().then(() => {
        if (isCurrent()) setSettledSrc(src);
      });
      return () => {
        active = false;
      };
    }

    const url = src;
    const preparedHost = host;
    const image = new Image();
    image.alt = '';
    image.className = 'absolute inset-0 size-full object-cover';
    image.decoding = 'async';
    image.src = src;
    async function prepare() {
      try {
        await image.decode();
        if (!isCurrent()) return;
        preparedHost.replaceChildren(image);
        displayedUrl.current = url;
        setSettledSrc(url);
      } catch {
        if (!isCurrent()) return;
        setSettledSrc(url);
      }
    }
    void prepare();
    return () => {
      active = false;
    };
  }, [src]);

  return (
    <div
      aria-busy={pending}
      className={`pointer-events-none relative overflow-hidden ${className}`}
    >
      <div aria-hidden="true" className="absolute inset-0">
        {pending ? <Skeleton animation="none" className="size-full rounded-none" /> : fallback}
      </div>
      <div ref={hostRef} aria-hidden="true" hidden={!src} className="absolute inset-0" />
      {children}
    </div>
  );
}
