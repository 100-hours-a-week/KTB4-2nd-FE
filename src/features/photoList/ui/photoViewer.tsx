'use client';

import { useEffect, useMemo, useRef } from 'react';

import { DropdownMenu, type DropdownMenuItem } from '@/shared/ui/dropdownMenu';

import { usePhotoOriginalQuery } from '../model/usePhotoOriginal';
import { PHOTO_ACCENT_GRADIENT } from '../model/photoAccent';
import type { PhotoListItem } from '../model/types';
import { markPhotoViewer, PhotoViewerArtwork } from './photoViewerArtwork';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
  ImageIcon,
  RestoreIcon,
  TrashIcon,
} from '@/shared/ui/icons';

export function PhotoViewer({
  photo,
  current,
  total,
  tripName,
  placeName,
  onClose,
  onPrevious,
  onNext,
  onDownload,
  onRestore,
  actionsDisabled = false,
  onDelete,
}: {
  photo: PhotoListItem;
  current: number;
  total: number;
  tripName: string;
  placeName: string;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDownload?: () => void;
  onRestore?: () => void;
  actionsDisabled?: boolean;
  onDelete: () => void;
}) {
  const original = usePhotoOriginalQuery(photo.id);
  const viewerRef = useRef<HTMLElement>(null);
  const previous = () => {
    markPhotoViewer('navigation');
    onPrevious();
  };
  const next = () => {
    markPhotoViewer('navigation');
    onNext();
  };

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    viewerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const viewer = viewerRef.current;
      if (!viewer || event.defaultPrevented) return;

      const active = document.activeElement;
      const activeDialog = active?.closest('[role="dialog"], [role="alertdialog"]');
      if (activeDialog && activeDialog !== viewer) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        if (active?.closest('[role="menu"]')) return;
        event.preventDefault();
        markPhotoViewer('navigation');
        if (event.key === 'ArrowLeft') onPrevious();
        else onNext();
      } else if (event.key === 'Tab') {
        const buttons = viewer.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first || !last) return;

        if (event.shiftKey && (active === first || !viewer.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (active === last || !viewer.contains(active))) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext]);

  const menuItems: DropdownMenuItem[] = useMemo(
    () => [
      ...(onRestore
        ? [
            {
              id: 'restore',
              label: '해제',
              icon: <RestoreIcon size="17" />,
              onSelect: onRestore,
              disabled: actionsDisabled,
            },
          ]
        : onDownload
          ? [
              {
                id: 'download',
                label: '원본 다운로드',
                icon: <DownloadIcon size="17" />,
                onSelect: onDownload,
                disabled: actionsDisabled,
              },
            ]
          : []),
      {
        id: 'delete',
        disabled: actionsDisabled,
        label: '삭제',
        icon: <TrashIcon size="17" />,
        destructive: true,
        dividerBefore: true,
        onSelect: onDelete,
      },
    ],
    [onDelete, onDownload, onRestore, actionsDisabled],
  );

  return (
    <section
      ref={viewerRef}
      role="dialog"
      aria-modal="true"
      aria-label="사진 원본 보기"
      className="fixed top-[var(--app-vertical-offset)] right-0 bottom-[var(--app-vertical-offset)] left-0 z-40 mx-auto flex w-full max-w-[430px] flex-col bg-[#070c11] text-white"
    >
      <header className="grid min-h-16 grid-cols-[48px_1fr_48px] items-center px-3 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          aria-label="원본 보기 닫기"
          onClick={onClose}
          className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-white/10"
        >
          <CloseIcon strokeWidth="2" size="22" />
        </button>
        <p aria-label="사진 순서" className="text-center text-sm font-bold">
          {current} <span className="text-white/50">/ {total}</span>
        </p>
        <DropdownMenu
          items={menuItems}
          label="사진 더보기 메뉴"
          trigger={<span className="text-xl leading-none text-white">•••</span>}
        />
      </header>

      <div className="relative flex min-h-0 flex-1 items-center">
        <button
          type="button"
          aria-label="이전 사진"
          onClick={previous}
          className="absolute left-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-white/15"
        >
          <ChevronLeftIcon strokeWidth="2" size="20" />
        </button>
        <div className="aspect-square w-full overflow-hidden">
          <PhotoViewerArtwork
            photoId={photo.id}
            thumbnailUrl={photo.loadFailed ? null : photo.thumbnailUrl}
            originalUrl={original.data?.originalUrl ?? null}
            originalFailed={original.isError || (original.isSuccess && !original.data?.originalUrl)}
            placeholder={
              <PhotoArtwork photo={{ ...photo, thumbnailUrl: null, loadFailed: false }} large />
            }
          />
        </div>
        <button
          type="button"
          aria-label="다음 사진"
          onClick={next}
          className="absolute right-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-white/15"
        >
          <ChevronRightIcon strokeWidth="2" size="20" />
        </button>
      </div>

      <footer className="px-5 pt-4 pb-[calc(28px+env(safe-area-inset-bottom))]">
        <strong className="block truncate text-sm">{placeName}</strong>
        <span className="mt-1 block truncate text-[11px] text-white/55">
          {tripName}
          {photo.capturedAt && ` · ${formatCapturedDate(photo.capturedAt)}`}
        </span>
      </footer>
    </section>
  );
}

export function PhotoArtwork({ photo, large = false }: { photo: PhotoListItem; large?: boolean }) {
  if (photo.loadFailed) {
    return (
      <span className="text-muted flex size-full flex-col items-center justify-center bg-slate-100 text-[9px]">
        <ImageIcon strokeWidth="1.7" size="32" />
        <span className="mt-2">불러오지 못함</span>
      </span>
    );
  }

  if (photo.thumbnailUrl) {
    return (
      <span
        aria-hidden="true"
        className="block size-full bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(photo.thumbnailUrl)})` }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`relative block size-full overflow-hidden bg-gradient-to-b ${PHOTO_ACCENT_GRADIENT[photo.accent]}`}
    >
      <span
        className={`absolute right-[14%] top-[14%] rounded-full bg-[#ffe59a] ${large ? 'size-16' : 'size-[17%]'}`}
      />
      <span className="absolute -right-[8%] bottom-[-10%] h-[42%] w-[82%] rounded-[50%] bg-black/15" />
      <span className="absolute -left-[10%] bottom-[-13%] h-[48%] w-[92%] rounded-[50%] bg-white/18" />
    </span>
  );
}

function formatCapturedDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}
