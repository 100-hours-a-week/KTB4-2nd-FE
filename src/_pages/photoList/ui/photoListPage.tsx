'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { DropdownMenu, type DropdownMenuItem } from '@/shared/ui/dropdownMenu';
import { toast } from '@/shared/ui/toast';

import type { PhotoAccent, PhotoListItem } from '../model/types';

const LONG_PRESS_DELAY_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

export type PhotoListPageProps = {
  tripId: number;
  tripName: string;
  placeName: string;
  initialPhotos: PhotoListItem[];
};

export function PhotoListPage({ tripId, tripName, placeName, initialPhotos }: PhotoListPageProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  const activeIndex = photos.findIndex((photo) => photo.id === activePhotoId);
  const activePhoto = activeIndex >= 0 ? photos[activeIndex] : null;
  const selectedCount = selectedIds.size;
  const allSelected = photos.length > 0 && selectedCount === photos.length;

  function leaveSelectionMode() {
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

  function selectPhotoFromLongPress(photoId: number) {
    setSelectionMode(true);
    setSelectedIds((current) => new Set(current).add(photoId));
  }

  function deletePhotos() {
    const deleted = new Set(pendingDeleteIds);
    setPhotos((current) => current.filter((photo) => !deleted.has(photo.id)));
    setPendingDeleteIds([]);
    setActivePhotoId(null);
    leaveSelectionMode();
    toast.success('사진이 삭제됐어요.');
  }

  return (
    <main className="page-enter text-brand bg-surface relative mx-auto min-h-dvh w-full max-w-[430px] px-4 pt-[max(20px,env(safe-area-inset-top))] pb-8">
      <PhotoListHeader
        tripId={tripId}
        placeName={placeName}
        selectionMode={selectionMode}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onEnterSelection={() => setSelectionMode(true)}
        onCancelSelection={leaveSelectionMode}
        onToggleAll={() =>
          setSelectedIds(allSelected ? new Set() : new Set(photos.map((photo) => photo.id)))
        }
      />

      <p className="text-muted mt-1 text-[11px]">
        {tripName} · {selectionMode ? '사진을 눌러 선택하세요' : `사진 ${photos.length}장`}
      </p>

      {photos.length === 0 ? (
        <EmptyPhotoList onAdd={() => toast.warning('아직 지원하지 않는 기능이에요.')} />
      ) : (
        <ul
          aria-label="사진 목록"
          className={`mt-3 grid grid-cols-3 gap-1 ${selectionMode ? 'pb-20' : ''}`}
        >
          {photos.map((photo, index) => {
            const selected = selectedIds.has(photo.id);
            return (
              <li key={photo.id}>
                <PhotoGridItem
                  photo={photo}
                  index={index}
                  selectionMode={selectionMode}
                  selected={selected}
                  onActivate={() =>
                    selectionMode ? togglePhoto(photo.id) : setActivePhotoId(photo.id)
                  }
                  onLongPress={() => selectPhotoFromLongPress(photo.id)}
                />
              </li>
            );
          })}
        </ul>
      )}

      {selectionMode && photos.length > 0 && (
        <SelectionActions
          disabled={selectedCount === 0}
          onDownload={() => toast.success('사진을 다운했어요.')}
          onDelete={() => setPendingDeleteIds([...selectedIds])}
        />
      )}

      {activePhoto && (
        <PhotoViewer
          photo={activePhoto}
          current={activeIndex + 1}
          total={photos.length}
          tripName={tripName}
          placeName={placeName}
          onClose={() => setActivePhotoId(null)}
          onPrevious={() =>
            setActivePhotoId(photos[(activeIndex - 1 + photos.length) % photos.length].id)
          }
          onNext={() => setActivePhotoId(photos[(activeIndex + 1) % photos.length].id)}
          onDownload={() => toast.success('사진을 다운했어요.')}
          onDelete={() => setPendingDeleteIds([activePhoto.id])}
        />
      )}

      <Dialog
        destructive
        open={pendingDeleteIds.length > 0}
        onClose={() => setPendingDeleteIds([])}
        title={
          pendingDeleteIds.length > 1
            ? `사진 ${pendingDeleteIds.length}장을 삭제하시겠습니까?`
            : '사진을 삭제하시겠습니까?'
        }
        description="삭제 후에는 되돌릴 수 없습니다."
      >
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => setPendingDeleteIds([])}
            className="min-h-11 w-full px-0 text-sm"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={deletePhotos}
            className="min-h-11 w-full px-0 text-sm"
          >
            삭제하기
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}

function PhotoGridItem({
  photo,
  index,
  selectionMode,
  selected,
  onActivate,
  onLongPress,
}: {
  photo: PhotoListItem;
  index: number;
  selectionMode: boolean;
  selected: boolean;
  onActivate: () => void;
  onLongPress: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const longPressTriggeredRef = useRef(false);

  function cancelLongPress() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => cancelLongPress, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (selectionMode || event.button !== 0) return;

    cancelLongPress();
    longPressTriggeredRef.current = false;
    startPointRef.current = { x: event.clientX, y: event.clientY };
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      longPressTriggeredRef.current = true;
      onLongPress();
    }, LONG_PRESS_DELAY_MS);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const movedX = Math.abs(event.clientX - startPointRef.current.x);
    const movedY = Math.abs(event.clientY - startPointRef.current.y);
    if (movedX > LONG_PRESS_MOVE_TOLERANCE_PX || movedY > LONG_PRESS_MOVE_TOLERANCE_PX) {
      cancelLongPress();
    }
  }

  function handleClick() {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onActivate();
  }

  return (
    <button
      type="button"
      aria-label={
        selectionMode
          ? `${index + 1}번째 사진 ${selected ? '선택 해제' : '선택'}`
          : `${index + 1}번째 사진 보기`
      }
      aria-pressed={selectionMode ? selected : undefined}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
      className={`focus-visible:outline-brand relative block aspect-square w-full touch-manipulation cursor-pointer overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 ${selected ? 'ring-brand ring-2 ring-inset' : ''}`}
    >
      <PhotoArtwork photo={photo} />
      {selectionMode && <SelectionMark selected={selected} />}
    </button>
  );
}

function PhotoListHeader({
  tripId,
  placeName,
  selectionMode,
  selectedCount,
  allSelected,
  onEnterSelection,
  onCancelSelection,
  onToggleAll,
}: {
  tripId: number;
  placeName: string;
  selectionMode: boolean;
  selectedCount: number;
  allSelected: boolean;
  onEnterSelection: () => void;
  onCancelSelection: () => void;
  onToggleAll: () => void;
}) {
  return (
    <header className="grid min-h-12 grid-cols-[64px_1fr_64px] items-center">
      {selectionMode ? (
        <button
          type="button"
          onClick={onCancelSelection}
          className="focus-visible:outline-brand justify-self-start rounded px-1 py-2 text-sm font-bold focus-visible:outline-2"
        >
          취소
        </button>
      ) : (
        <Link
          href={`/trips/${tripId}`}
          aria-label="여행 상세로 돌아가기"
          className="hover:bg-brand/5 focus-visible:outline-brand grid size-10 place-items-center rounded-full transition-colors focus-visible:outline-2"
        >
          <BackIcon />
        </Link>
      )}

      <h1 className="truncate text-center text-[17px] font-extrabold">
        {selectionMode ? `${selectedCount}장 선택됨` : placeName}
      </h1>

      <button
        type="button"
        onClick={selectionMode ? onToggleAll : onEnterSelection}
        className="focus-visible:outline-brand justify-self-end rounded px-1 py-2 text-sm font-bold focus-visible:outline-2"
      >
        {selectionMode ? (allSelected ? '전체 해제' : '전체 선택') : '선택'}
      </button>
    </header>
  );
}

function SelectionActions({
  disabled,
  onDownload,
  onDelete,
}: {
  disabled: boolean;
  onDownload: () => void;
  onDelete: () => void;
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="toolbar"
      aria-label="선택한 사진 작업"
      className="bg-surface border-border-subtle fixed right-0 bottom-0 left-0 z-30 mx-auto grid w-full max-w-[430px] grid-cols-2 gap-2 border-t px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(2,23,48,0.08)]"
    >
      <Button
        variant="secondary"
        disabled={disabled}
        onClick={onDownload}
        className="min-h-11 gap-2 px-2 text-sm"
      >
        <DownloadIcon /> 다운로드
      </Button>
      <Button
        variant="destructive"
        disabled={disabled}
        onClick={onDelete}
        className="min-h-11 gap-2 px-2 text-sm"
      >
        <TrashIcon /> 삭제
      </Button>
    </div>,
    document.body,
  );
}

function EmptyPhotoList({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="flex min-h-[68vh] flex-col items-center justify-center text-center">
      <span className="text-muted grid size-16 place-items-center rounded-full bg-slate-100">
        <EmptyImageIcon />
      </span>
      <h2 className="mt-4 text-base font-extrabold">폴더에 사진이 없어요</h2>
      <p className="text-muted mt-1 text-xs">사진을 추가해보세요!</p>
      <Button onClick={onAdd} className="mt-5 min-h-10 rounded-full px-5 text-sm">
        ＋ 사진 추가
      </Button>
    </section>
  );
}

function PhotoViewer({
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
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
      role="dialog"
      aria-modal="true"
      aria-label="사진 원본 보기"
      className="fixed inset-0 z-40 mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-[#070c11] text-white"
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
          <PhotoArtwork photo={photo} large />
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
          {tripName} · {formatCapturedDate(photo.capturedAt)}
        </span>
      </footer>
    </section>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full border-2 text-[11px] font-bold ${selected ? 'border-brand bg-brand text-white' : 'border-white bg-black/15 text-transparent'}`}
    >
      ✓
    </span>
  );
}

function PhotoArtwork({ photo, large = false }: { photo: PhotoListItem; large?: boolean }) {
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

function BackIcon() {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
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
