'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { photoListQueries } from '@/queryFactory';
import { toast } from '@/shared/ui/toast';

import { getStoryPhotoLabel, type StoryDay, type StoryPhoto } from '../model/types';

export function StoryPhotoViewer({
  photo,
  day,
  current,
  total,
  onClose,
  onPrevious,
  onNext,
}: {
  photo: StoryPhoto;
  day: StoryDay;
  current: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const original = useQuery({
    ...photoListQueries.original(photo.attachmentId ?? 0),
    enabled: photo.attachmentId !== null,
  });
  const url = original.data?.originalUrl;
  const failed =
    original.isError || (!url && photo.attachmentId === null) || (!!url && failedUrl === url);
  const reportedPhoto = useRef<string | null>(null);

  useEffect(() => {
    if (failed && reportedPhoto.current !== photo.id) {
      reportedPhoto.current = photo.id;
      toast.error('사진 로드에 실패했어요.');
    }
  }, [failed, photo.id]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        if (event.key === 'Escape') onClose();
        else if (total > 1 && event.key === 'ArrowLeft') onPrevious();
        else if (total > 1) onNext();
      } else if (event.key === 'Tab') {
        const buttons =
          panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext, total]);

  return createPortal(
    <section
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="스토리 사진 상세보기"
      className="fixed top-[var(--app-vertical-offset)] right-0 bottom-[var(--app-vertical-offset)] left-0 z-40 mx-auto flex w-full max-w-[430px] flex-col bg-[#070a0d] text-white"
    >
      <header className="flex min-h-16 items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          aria-label="사진 상세보기 닫기"
          onClick={onClose}
          className="grid size-11 cursor-pointer place-items-center rounded-xl bg-white/10 text-2xl hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">×</span>
        </button>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/75">
          원본 화질
        </span>
      </header>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {failed ? (
          <p role="status" className="px-6 text-center text-sm text-white/60">
            사진을 불러오지 못했어요
          </p>
        ) : url ? (
          // 서명된 원본 URL은 이미지 최적화 프록시를 거치지 않고 그대로 표시합니다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={photo.sentence}
            onError={() => setFailedUrl(url)}
            className="max-h-full w-full object-contain"
          />
        ) : (
          <p role="status" className="text-sm text-white/60">
            원본 사진을 불러오는 중이에요…
          </p>
        )}
      </div>
      <footer className="px-5 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
          <span aria-hidden="true">⌖</span> {getStoryPhotoLabel(photo)}
        </span>
        <p className="mt-2.5 text-xs text-white/55">
          {day.date.slice(5).replace('-', '.')} {day.dayNumber}일째
        </p>
        <p className="mt-1.5 text-sm font-semibold leading-6">{photo.sentence}</p>
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            aria-label="이전 사진"
            disabled={total <= 1}
            onClick={onPrevious}
            className="grid size-10 cursor-pointer place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-30"
          >
            ←
          </button>
          <p
            aria-live="polite"
            aria-label="사진 순서"
            className="text-xs tabular-nums text-white/60"
          >
            {current} / {total}
          </p>
          <button
            type="button"
            aria-label="다음 사진"
            disabled={total <= 1}
            onClick={onNext}
            className="grid size-10 cursor-pointer place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-30"
          >
            →
          </button>
        </div>
      </footer>
    </section>,
    document.body,
  );
}
