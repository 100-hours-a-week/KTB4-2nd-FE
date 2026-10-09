'use client';

import { useEffect, useMemo, useRef } from 'react';

import { DropdownMenu, type DropdownMenuItem } from '@/shared/ui/dropdownMenu';

import { usePhotoOriginal } from '../model/usePhotoOriginal';
import type { PhotoAccent, PhotoListItem } from '../model/types';

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
  onDownload: () => void;
  onDelete: () => void;
}) {
  // 원본은 열었을 때만 발급받고, 도착하기 전에는 목록 썸네일을 그대로 보여줍니다.
  const originalUrl = usePhotoOriginal(photo.id);
  const viewerRef = useRef<HTMLElement>(null);

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
      // 삭제 확인창 등 다른 대화상자가 열렸다면 해당 창이 키보드 입력을 처리합니다.
      if (activeDialog && activeDialog !== viewer) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        if (active?.closest('[role="menu"]')) return;
        event.preventDefault();
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
      { id: 'download', label: '원본 다운로드', icon: <DownloadIcon />, onSelect: onDownload },
      {
        id: 'delete',
        label: '삭제',
        icon: <TrashIcon />,
        destructive: true,
        dividerBefore: true,
        onSelect: onDelete,
      },
    ],
    [onDelete, onDownload],
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
          <CloseIcon />
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
          onClick={onPrevious}
          className="absolute left-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-white/15"
        >
          <PreviousIcon />
        </button>
        <div className="aspect-square w-full overflow-hidden">
          <PhotoArtwork
            photo={originalUrl ? { ...photo, thumbnailUrl: originalUrl } : photo}
            large
          />
        </div>
        <button
          type="button"
          aria-label="다음 사진"
          onClick={onNext}
          className="absolute right-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-white/15"
        >
          <NextIcon />
        </button>
      </div>

      <footer className="px-5 pt-4 pb-[calc(28px+env(safe-area-inset-bottom))]">
        <strong className="block text-sm">{placeName}</strong>
        <span className="mt-1 block text-[11px] text-white/55">
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
        <EmptyImageIcon />
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

  const accentClass: Record<PhotoAccent, string> = {
    coast: 'from-[#cee7f0] via-[#70abc5] to-[#e6d6a5]',
    night: 'from-[#34476f] via-[#1d2c50] to-[#0e1a2e]',
    blossom: 'from-[#d9edf3] via-[#f4b9ca] to-[#8fb77b]',
    sunset: 'from-[#1d2945] via-[#293657] to-[#f1a456]',
    island: 'from-[#acd8ee] via-[#80b76d] to-[#407a3d]',
    desert: 'from-[#f4d9ad] via-[#d77b46] to-[#a94728]',
  };

  return (
    <span
      aria-hidden="true"
      className={`relative block size-full overflow-hidden bg-gradient-to-b ${accentClass[photo.accent]}`}
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

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function PreviousIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />
    </svg>
  );
}

function EmptyImageIcon() {
  return (
    <svg
      aria-hidden="true"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 5-5 4 4 2-2 5 5" />
    </svg>
  );
}
