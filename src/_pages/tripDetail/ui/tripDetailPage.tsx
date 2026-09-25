'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { DropdownMenu, type DropdownMenuItem } from '@/shared/ui/dropdownMenu';
import { SelectDropdown } from '@/shared/ui/selectDropdown';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';

import type { TripDetail, TripDetailViewState, TripPlaceFolder } from '../model/types';

export type TripDetailPageProps = {
  trip: TripDetail;
  viewState?: TripDetailViewState;
  onRetry?: () => void;
  onDelete?: (tripId: number) => void;
};

type SharePermission = 'read' | 'edit';

type SharedPerson = {
  id: number;
  email: string;
  permission: SharePermission;
};

const INITIAL_SHARED_PEOPLE: SharedPerson[] = [
  { id: 1, email: 'alice5855@gmail.com', permission: 'read' },
  { id: 2, email: 'hazel@naver.com', permission: 'read' },
  { id: 3, email: 'hazel@gmail.com', permission: 'edit' },
];

const PERMISSION_OPTIONS = [
  { value: 'read', label: '읽기 허용' },
  { value: 'edit', label: '편집 허용' },
] as const;

export function TripDetailPage({
  trip,
  viewState = 'ready',
  onRetry,
  onDelete,
}: TripDetailPageProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sharedPeople, setSharedPeople] = useState(INITIAL_SHARED_PEOPLE);

  const showUnsupportedToast = () => toast.warning('아직 지원하지 않는 기능이에요.');
  const menuItems: DropdownMenuItem[] = [
    {
      id: 'edit',
      label: '여행 수정',
      icon: <EditIcon />,
      badge: '준비 중',
      onSelect: showUnsupportedToast,
    },
    {
      id: 'share-link',
      label: '링크로 공유하기',
      icon: <LinkIcon />,
      onSelect: () => setShareOpen(true),
    },
    {
      id: 'delete',
      label: '여행 삭제',
      icon: <TrashIcon />,
      destructive: true,
      dividerBefore: true,
      onSelect: () => setDeleteOpen(true),
    },
  ];

  return (
    <main className="page-enter text-brand bg-surface relative mx-auto min-h-dvh w-full max-w-[430px] px-5 pt-[max(20px,env(safe-area-inset-top))] pb-10">
      <header className="grid min-h-12 grid-cols-[40px_1fr_40px] items-center">
        <Link
          href="/trips"
          aria-label="여행 목록으로 돌아가기"
          className="hover:bg-brand/5 focus-visible:outline-brand grid size-10 place-items-center rounded-full transition-colors focus-visible:outline-2"
        >
          <BackIcon />
        </Link>
        <h1 className="truncate px-2 text-center text-[17px] font-extrabold tracking-[-0.02em]">
          {trip.name}
        </h1>
        <DropdownMenu items={menuItems} label="여행 더보기 메뉴" />
      </header>

      <TripMeta trip={trip} />

      <section aria-label="여행 바로가기" className="mt-5 grid grid-cols-[1fr_100px] gap-2.5">
        <button
          type="button"
          onClick={showUnsupportedToast}
          className="bg-brand hover:bg-brand-hover focus-visible:outline-brand flex min-h-[66px] cursor-pointer items-center gap-3 rounded-[14px] px-4 text-left text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/10">
            <StoryIcon />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm">스토리 보기</strong>
            <span className="mt-0.5 block truncate text-[10px] text-white/60">
              자동 생성된 여행일기
            </span>
          </span>
          <ChevronIcon />
        </button>

        <button
          type="button"
          onClick={showUnsupportedToast}
          className="focus-visible:outline-warning relative flex min-h-[66px] cursor-pointer flex-col justify-center rounded-[14px] bg-[#fff4d8] px-3 text-left text-[#71511b] transition-colors hover:bg-[#ffedc0] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ReviewIcon />
          <strong className="mt-1 text-[11px]">확인 필요</strong>
          <span className="absolute top-2.5 right-2.5 grid min-w-5 place-items-center rounded-full bg-[#e78b00] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {trip.reviewCount > 99 ? '99+' : trip.reviewCount}
          </span>
        </button>
      </section>

      <div className="bg-surface-subtle mt-4 grid grid-cols-2 rounded-[12px] p-1">
        <button
          type="button"
          onClick={showUnsupportedToast}
          className="text-muted focus-visible:outline-brand flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] text-sm font-bold focus-visible:outline-2"
        >
          지도로 보기
          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold">
            준비 중
          </span>
        </button>
        <button
          type="button"
          aria-pressed="true"
          className="bg-surface text-brand min-h-10 rounded-[9px] text-sm font-extrabold shadow-[0_2px_8px_rgba(2,23,48,0.08)]"
        >
          목록으로 보기
        </button>
      </div>

      <section aria-label="장소별 사진" className="mt-5">
        {viewState === 'ready' ? (
          <ul className="grid grid-cols-2 gap-x-2.5 gap-y-4">
            {trip.folders.map((folder) => (
              <li key={folder.id}>
                <PlaceFolderCard folder={folder} onSelect={showUnsupportedToast} />
              </li>
            ))}
          </ul>
        ) : (
          <PlaceFolderSkeleton showError={viewState === 'error'} onRetry={onRetry} />
        )}
      </section>

      <Dialog
        destructive
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="정말 삭제하시겠습니까?"
        description={
          <>
            ‘{trip.name}’과 사진 {trip.photoCount}장이 삭제되며
            <br />
            삭제 후에는 되돌릴 수 없습니다.
          </>
        }
      >
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => setDeleteOpen(false)}
            className="min-h-11 w-full px-0 text-sm"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setDeleteOpen(false);
              if (onDelete) {
                onDelete(trip.id);
                return;
              }
              showUnsupportedToast();
            }}
            className="min-h-11 w-full px-0 text-sm"
          >
            삭제하기
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        size="wide"
        title="공유할 이메일을 입력해주세요"
        description={`‘${trip.name}’을 함께 볼 사람을 초대해요`}
      >
        <div className="text-left">
          <label className="border-field-border flex min-h-12 items-center gap-2.5 rounded-[12px] border-2 px-3.5">
            <MailIcon />
            <span className="sr-only">공유할 이메일</span>
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="email@example.com"
              className="text-brand min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <p className="text-muted mt-4 text-xs font-bold">공유할 사람 {sharedPeople.length}</p>
          <ul className="bg-surface-subtle mt-2 overflow-visible rounded-[14px]">
            {sharedPeople.map((person) => (
              <li
                key={person.id}
                className="border-border-subtle flex min-h-14 items-center gap-2 border-b px-3 last:border-b-0"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                  {person.email}
                </span>
                <SelectDropdown
                  label={`${person.email} 공유 권한`}
                  value={person.permission}
                  options={PERMISSION_OPTIONS}
                  onChange={(permission) =>
                    setSharedPeople((people) =>
                      people.map((item) =>
                        item.id === person.id ? { ...item, permission } : item,
                      ),
                    )
                  }
                />
              </li>
            ))}
          </ul>

          <Button
            onClick={() => {
              const email = inviteEmail.trim();
              if (!email || sharedPeople.some((person) => person.email === email)) return;
              setSharedPeople((people) => [
                ...people,
                { id: Date.now(), email, permission: 'read' },
              ]);
              setInviteEmail('');
            }}
            disabled={!inviteEmail.trim()}
            className="mt-5 w-full text-sm"
          >
            추가하기
          </Button>
          <button
            type="button"
            onClick={() => setShareOpen(false)}
            className="text-muted hover:text-brand focus-visible:outline-brand mx-auto mt-4 block cursor-pointer rounded text-sm font-semibold focus-visible:outline-2"
          >
            나중에 할게요
          </button>
        </div>
      </Dialog>
    </main>
  );
}

function TripMeta({ trip }: { trip: TripDetail }) {
  const location =
    trip.locations.length > 1
      ? `${trip.locations[0]} 외 ${trip.locations.length - 1}개`
      : (trip.locations[0] ?? '장소 없음');

  return (
    <section aria-label="여행 정보" className="text-muted mt-2 space-y-1 text-[12px] font-medium">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <PinIcon /> {location}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarIcon /> {formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)} ·{' '}
          {trip.nights}박
        </span>
      </p>
      <p className="inline-flex items-center gap-1">
        <PhotoIcon /> 사진 {trip.photoCount}장
      </p>
    </section>
  );
}

function PlaceFolderCard({ folder, onSelect }: { folder: TripPlaceFolder; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="focus-visible:outline-brand block w-full cursor-pointer rounded-[14px] text-left transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <FolderThumbnail folder={folder} />
      <strong className="mt-2 block truncate text-[13px] font-extrabold">{folder.name}</strong>
      <span className="text-muted mt-0.5 block text-[10px]">{folder.photoCount}장</span>
    </button>
  );
}

function FolderThumbnail({ folder }: { folder: TripPlaceFolder }) {
  if (folder.thumbnailUrl) {
    return (
      <span
        aria-hidden="true"
        className="block aspect-square w-full rounded-[14px] bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(folder.thumbnailUrl)})` }}
      />
    );
  }

  const accentClass: Record<TripPlaceFolder['accent'], string> = {
    coast: 'from-[#cce4ee] via-[#6eafc8] to-[#d8cda0]',
    sunset: 'from-[#1d2b49] via-[#314263] to-[#f5a85a]',
    island: 'from-[#acd6ed] via-[#70ad64] to-[#447c3e]',
    night: 'from-[#425783] via-[#23365c] to-[#101d34]',
    field: 'from-[#f3deb4] via-[#ce9956] to-[#788b56]',
    sky: 'from-[#badbea] via-[#96c5dc] to-[#e9d8a9]',
  };

  return (
    <span
      aria-hidden="true"
      className={`relative block aspect-square w-full overflow-hidden rounded-[14px] bg-gradient-to-b ${accentClass[folder.accent]}`}
    >
      <span className="absolute right-[14%] top-[16%] size-[18%] rounded-full bg-[#ffe7a6]" />
      <span className="absolute -right-[8%] bottom-[-8%] h-[42%] w-[80%] rounded-[50%] bg-black/16" />
      <span className="absolute -left-[12%] bottom-[-10%] h-[48%] w-[90%] rounded-[50%] bg-white/18" />
    </span>
  );
}

function PlaceFolderSkeleton({ showError, onRetry }: { showError: boolean; onRetry?: () => void }) {
  return (
    <div role="status" aria-label="장소 사진 불러오는 중">
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="aspect-square w-full rounded-[14px]" />
            <Skeleton className="mt-2 h-3 w-16" />
            <Skeleton className="mt-1.5 h-2.5 w-9" />
          </div>
        ))}
      </div>
      {showError && (
        <div
          role="alert"
          className="bg-brand fixed right-5 bottom-[calc(20px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto flex max-w-[390px] items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg"
        >
          <WarningIcon />
          <span className="flex-1">사진 로드에 실패했어요.</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="cursor-pointer font-bold text-[#a9c8ff] hover:underline"
            >
              다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatShortDate(date: string) {
  return date.slice(2).replaceAll('-', '.');
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
function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M3 10h18" />
    </svg>
  );
}
function PhotoIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 5-5 4 4 2-2 5 5" />
    </svg>
  );
}
function StoryIcon() {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
function ReviewIcon() {
  return (
    <svg
      aria-hidden="true"
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v12H4Z" />
      <path d="M12 9v4m0 3v.01" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffb1a9"
      strokeWidth="1.8"
    >
      <path d="M10.3 3.7 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4m0 4h.01" />
    </svg>
  );
}
