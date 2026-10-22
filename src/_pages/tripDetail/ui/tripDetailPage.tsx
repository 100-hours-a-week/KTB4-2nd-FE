'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  PLACE_FOLDER_ACCENT_GRADIENT,
  useDeleteTrip,
  useTripPlaceFolders,
  useTripSummary,
  type TripDetail,
  type TripPlaceFolder,
} from '@/features/tripDetail';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { DropdownMenu, type DropdownMenuItem } from '@/shared/ui/dropdownMenu';
import {
  CalendarIcon,
  ChevronRightIcon,
  DocumentIcon,
  EditIcon,
  FolderWarningIcon,
  ImageIcon,
  LinkIcon,
  PinIcon,
  TrashIcon,
  WarningIcon,
} from '@/shared/ui/icons';
import { PageHeader } from '@/shared/ui/pageHeader';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';

export type TripDetailPageProps = {
  trip: TripDetail;
};

export function TripDetailPage({ trip: initialTrip }: TripDetailPageProps) {
  const router = useRouter();
  const trip = useTripSummary(initialTrip);
  const { folders, viewState, refetch } = useTripPlaceFolders(trip.id);
  const { mutate: requestDelete, isPending: isDeleting } = useDeleteTrip(trip.id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [storyEmptyOpen, setStoryEmptyOpen] = useState(false);

  const handleBack = () => {
    router.replace('/trips');
  };

  const showUnsupportedToast = () => toast.warning('아직 지원하지 않는 기능이에요.');

  function openStory() {
    if (trip.hasStory) {
      router.push(`/trips/${trip.id}/story`);
      return;
    }

    setStoryEmptyOpen(true);
  }

  const menuItems: DropdownMenuItem[] = [
    {
      id: 'edit',
      label: '여행 수정',
      icon: <EditIcon size="20" />,
      onSelect: () => router.push(`/trips/${trip.id}/edit?step=name`),
    },
    {
      id: 'share-link',
      label: '링크로 공유하기',
      icon: <LinkIcon size="20" />,
      badge: '준비 중',
      disabled: true,
      onSelect: showUnsupportedToast,
    },
    {
      id: 'delete',
      label: '여행 삭제',
      icon: <TrashIcon size="20" />,
      destructive: true,
      dividerBefore: true,
      onSelect: () => setDeleteOpen(true),
    },
  ];

  return (
    <main className="page-enter text-brand bg-surface relative mx-auto min-h-full w-full max-w-[430px] px-5 pb-10">
      <PageHeader
        className="-mx-5 min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] px-5 pt-[max(20px,env(safe-area-inset-top))]"
        title={trip.name}
        onBack={handleBack}
        backLabel="여행 목록으로 돌아가기"
        action={<DropdownMenu items={menuItems} label="여행 더보기 메뉴" />}
      />

      <TripMeta trip={trip} />

      <section aria-label="여행 바로가기" className="mt-5 grid grid-cols-[1fr_100px] gap-2.5">
        <button
          type="button"
          onClick={openStory}
          className="bg-brand hover:bg-brand-hover focus-visible:outline-brand flex min-h-[66px] cursor-pointer items-center gap-3 rounded-[14px] px-4 text-left text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/10">
            <DocumentIcon size="19" variant="story" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm">스토리 보기</strong>
            <span className="mt-0.5 block truncate text-[10px] text-white/60">
              자동 생성된 여행일기
            </span>
          </span>
          <ChevronRightIcon strokeWidth="2" size="16" />
        </button>

        <Link
          href={`/trips/${trip.id}/unclassified?trip=${encodeURIComponent(trip.name)}`}
          className="focus-visible:outline-warning relative flex min-h-[66px] cursor-pointer flex-col justify-center rounded-[14px] bg-[#fff4d8] px-3 text-left text-[#71511b] transition-colors hover:bg-[#ffedc0] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <FolderWarningIcon size="21" />
          <strong className="mt-1 text-[11px]">확인 필요</strong>
        </Link>
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
        {viewState !== 'ready' ? (
          <PlaceFolderSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
        ) : folders.length === 0 ? (
          <EmptyPlaceFolders trip={trip} />
        ) : (
          <ul className="grid grid-cols-2 gap-x-2.5 gap-y-4">
            {folders.map((folder) => (
              <li key={folder.id}>
                <PlaceFolderCard trip={trip} folder={folder} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={storyEmptyOpen}
        onClose={() => setStoryEmptyOpen(false)}
        icon={<DocumentIcon size="19" variant="story" />}
        title="아직 스토리가 없어요"
        description={
          <>
            모든 사진과 분위기를 바탕으로
            <br />
            여행 스토리를 자동으로 만들어드릴게요.
          </>
        }
      >
        <div className="flex flex-col gap-1">
          <Button
            onClick={() => {
              setStoryEmptyOpen(false);
              router.push(`/trips/${trip.id}/story/create`);
            }}
            className="min-h-11 w-full px-0 text-sm"
          >
            스토리 만들기
          </Button>
          <Button
            variant="ghost"
            onClick={() => setStoryEmptyOpen(false)}
            className="min-h-10 w-full px-0 text-[13px] font-medium"
          >
            나중에 할게요
          </Button>
        </div>
      </Dialog>

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
            disabled={isDeleting}
            className="min-h-11 w-full px-0 text-sm"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={() => requestDelete(undefined, { onError: () => setDeleteOpen(false) })}
            isLoading={isDeleting}
            className="min-h-11 w-full px-0 text-sm"
          >
            삭제하기
          </Button>
        </DialogActions>
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
          <PinIcon size="13" /> {location}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarIcon size="13" /> {formatShortDate(trip.startDate)} -{' '}
          {formatShortDate(trip.endDate)} · {trip.nights}박
        </span>
      </p>
      <p className="inline-flex items-center gap-1">
        <ImageIcon size="13" /> 사진 {trip.photoCount}장
      </p>
    </section>
  );
}

function PlaceFolderCard({ trip, folder }: { trip: TripDetail; folder: TripPlaceFolder }) {
  const href = `/trips/${trip.id}/places/${folder.id}/photos?place=${encodeURIComponent(folder.name)}&trip=${encodeURIComponent(trip.name)}`;

  return (
    <Link
      href={href}
      aria-label={`${folder.name} 사진 ${folder.photoCount}장 보기`}
      className="focus-visible:outline-brand block w-full cursor-pointer rounded-[14px] text-left transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <FolderThumbnail folder={folder} />
      <strong className="mt-2 block truncate text-[13px] font-extrabold">{folder.name}</strong>
      <span className="text-muted mt-0.5 block text-[10px]">{folder.photoCount}장</span>
    </Link>
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

  return (
    <span
      aria-hidden="true"
      className={`relative block aspect-square w-full overflow-hidden rounded-[14px] bg-gradient-to-b ${PLACE_FOLDER_ACCENT_GRADIENT[folder.accent]}`}
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
          className="bg-brand fixed right-5 bottom-[calc(var(--app-vertical-offset)+20px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto flex max-w-[390px] items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg"
        >
          <WarningIcon stroke="#ffb1a9" size="17" />
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

function EmptyPlaceFolders({ trip }: { trip: TripDetail }) {
  const hasPhotos = trip.photoCount > 0;

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-3 py-10 text-center">
      <span className="text-muted grid size-16 place-items-center rounded-full bg-slate-100 [&>svg]:size-7">
        <ImageIcon size="13" />
      </span>
      <h2 className="mt-4 text-[15px] font-extrabold">
        {hasPhotos ? '장소를 찾은 사진이 없어요' : '아직 사진이 없어요'}
      </h2>
      <p className="text-muted mt-1.5 text-xs leading-5">
        {hasPhotos ? (
          <>
            위치 정보가 없는 사진은 미분류에 모아뒀어요.
            <br />
            미분류에서 원하는 장소로 옮길 수 있어요.
          </>
        ) : (
          '여행 수정에서 사진을 추가해 보세요.'
        )}
      </p>
      <Link
        href={
          hasPhotos
            ? `/trips/${trip.id}/unclassified?trip=${encodeURIComponent(trip.name)}`
            : `/trips/${trip.id}/edit?step=images`
        }
        className="bg-brand hover:bg-brand-hover focus-visible:outline-brand mt-5 inline-flex min-h-10 items-center rounded-full px-4 text-xs font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {hasPhotos ? '미분류 사진 보기' : '사진 추가하기'}
      </Link>
    </div>
  );
}
