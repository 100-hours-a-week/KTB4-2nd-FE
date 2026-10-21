'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PHOTO_ACCENT_GRADIENT } from '@/features/photoList';
import {
  UNCLASSIFIED_ISSUE_LABEL,
  toUnclassifiedIssueSlug,
  RestorePlaceDialog,
  RestorePlaceRequiredError,
  useRestoreUnclassifiedPhotos,
  useUnclassifiedFolders,
  type UnclassifiedIssue,
  type UnclassifiedFolder,
} from '@/features/unclassifiedPhotos';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { CheckIcon, RestoreIcon, TrashIcon, WarningIcon } from '@/shared/ui/icons';
import { PageHeader } from '@/shared/ui/pageHeader';
import { Skeleton } from '@/shared/ui/skeleton';

export type UnclassifiedFolderPageProps = {
  tripId: number;
  tripName: string;
};

export function UnclassifiedFolderPage({ tripId, tripName }: UnclassifiedFolderPageProps) {
  const router = useRouter();
  const { folders, viewState, refetch } = useUnclassifiedFolders(tripId);
  const { mutate: requestRestore, isPending: isRestoring } = useRestoreUnclassifiedPhotos(tripId);
  const [pendingRestoreFolder, setPendingRestoreFolder] = useState<UnclassifiedFolder | null>(null);
  const [placeRequest, setPlaceRequest] = useState<{
    issue: UnclassifiedIssue;
    photoCount: number;
  } | null>(null);

  const visibleFolders = folders.filter((folder) => folder.photoCount > 0);
  const totalCount = folders.reduce((sum, folder) => sum + folder.photoCount, 0);

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(`/trips/${tripId}`);
  }

  function confirmRestore() {
    if (!pendingRestoreFolder) return;

    const { issue } = pendingRestoreFolder;
    requestRestore(
      { issue },
      {
        onError: (error) => {
          if (error instanceof RestorePlaceRequiredError) {
            setPlaceRequest({ issue, photoCount: error.photoCount });
          }
        },
        onSettled: () => setPendingRestoreFolder(null),
      },
    );
  }

  function restoreWithPlace(tripPlaceId: number) {
    if (!placeRequest) return;

    requestRestore(
      { issue: placeRequest.issue, fallbackPlaceId: tripPlaceId },
      { onSuccess: () => setPlaceRequest(null) },
    );
  }

  return (
    <main className="page-enter text-brand bg-surface relative mx-auto min-h-full w-full max-w-[430px] px-5 pb-10">
      <PageHeader
        className="-mx-5 min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] px-5 pt-[max(20px,env(safe-area-inset-top))]"
        title="미분류 폴더"
        onBack={handleBack}
        backLabel="여행 상세로 돌아가기"
      />

      <section aria-label="여행 정보" className="mt-2">
        <h2 className="truncate text-lg font-extrabold">{tripName}</h2>
        <p className="text-muted mt-0.5 text-xs">
          {viewState === 'ready' ? `${totalCount}장` : ' '}
        </p>
      </section>

      <p className="bg-surface-subtle text-muted mt-4 flex gap-2.5 rounded-[14px] px-4 py-3.5 text-[12px] leading-relaxed">
        <span className="mt-0.5 shrink-0">
          <TrashIcon size="16" />
        </span>
        <span>
          흔들렸거나 기준에 맞지 않아 자동으로 분류된 사진이에요.
          <br />
          괜찮은 사진은 해제해서 원래 위치 폴더로 되돌릴 수 있어요.
        </span>
      </p>

      <section aria-label="분류 사유별 폴더" className="mt-5">
        {viewState !== 'ready' ? (
          <FolderSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
        ) : visibleFolders.length === 0 ? (
          <EmptyUnclassified />
        ) : (
          <ul className="grid grid-cols-2 gap-2.5">
            {visibleFolders.map((folder) => (
              <li key={folder.issue}>
                <UnclassifiedFolderCard
                  folder={folder}
                  href={`/trips/${tripId}/unclassified/${toUnclassifiedIssueSlug(folder.issue)}?trip=${encodeURIComponent(tripName)}`}
                  onRestore={() => setPendingRestoreFolder(folder)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={pendingRestoreFolder !== null}
        onClose={() => !isRestoring && setPendingRestoreFolder(null)}
        title={
          pendingRestoreFolder
            ? `${UNCLASSIFIED_ISSUE_LABEL[pendingRestoreFolder.issue]} ${pendingRestoreFolder.photoCount}장을 해제할까요?`
            : ''
        }
        description="해제한 사진은 원래 위치 폴더로 돌아가요."
      >
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => setPendingRestoreFolder(null)}
            disabled={isRestoring}
            className="min-h-11 w-full px-0 text-sm"
          >
            취소
          </Button>
          <Button
            onClick={confirmRestore}
            isLoading={isRestoring}
            className="min-h-11 w-full px-0 text-sm"
          >
            해제하기
          </Button>
        </DialogActions>
      </Dialog>
      <RestorePlaceDialog
        open={placeRequest !== null}
        tripId={tripId}
        photoCount={placeRequest?.photoCount ?? 0}
        isRestoring={isRestoring}
        onClose={() => setPlaceRequest(null)}
        onConfirm={restoreWithPlace}
      />
    </main>
  );
}

function UnclassifiedFolderCard({
  folder,
  href,
  onRestore,
}: {
  folder: UnclassifiedFolder;
  href: string;
  onRestore: () => void;
}) {
  const label = UNCLASSIFIED_ISSUE_LABEL[folder.issue];

  return (
    <div className="relative">
      <Link
        href={href}
        aria-label={`${label} ${folder.photoCount}장 보기`}
        className="focus-visible:outline-brand block w-full cursor-pointer overflow-hidden rounded-[14px] transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <FolderThumbnail folder={folder} />
        <span className="absolute top-2.5 left-2.5 max-w-[calc(100%-20px)] truncate rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
          {label} · {folder.photoCount}장
        </span>
      </Link>
      <button
        type="button"
        onClick={onRestore}
        aria-label={`${label} 전체 해제`}
        className="absolute right-2.5 bottom-2.5 inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full bg-black/45 px-3 text-[11px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <RestoreIcon strokeWidth="2" size="13" /> 해제
      </button>
    </div>
  );
}

function FolderThumbnail({ folder }: { folder: UnclassifiedFolder }) {
  if (folder.thumbnailUrl) {
    return (
      <span
        aria-hidden="true"
        className="block aspect-square w-full bg-slate-100 bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(folder.thumbnailUrl)})` }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`relative block aspect-square w-full overflow-hidden bg-gradient-to-b ${PHOTO_ACCENT_GRADIENT[folder.accent]}`}
    >
      <span className="absolute top-[16%] right-[14%] size-[18%] rounded-full bg-[#ffe7a6]" />
      <span className="absolute -right-[8%] bottom-[-8%] h-[42%] w-[80%] rounded-[50%] bg-black/16" />
      <span className="absolute bottom-[-10%] -left-[12%] h-[48%] w-[90%] rounded-[50%] bg-white/18" />
    </span>
  );
}

function FolderSkeleton({ showError, onRetry }: { showError: boolean; onRetry: () => void }) {
  return (
    <div
      role={showError ? undefined : 'status'}
      aria-label={showError ? undefined : '미분류 폴더 불러오는 중'}
      aria-busy={!showError}
    >
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            animation={showError ? 'none' : 'breathe'}
            delayMs={index * 120}
            className="aspect-square w-full rounded-[14px]"
          />
        ))}
      </div>
      {showError && (
        <div
          role="alert"
          className="bg-brand fixed right-5 bottom-[calc(var(--app-vertical-offset)+20px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto flex max-w-[390px] items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg"
        >
          <WarningIcon stroke="#ffb1a9" size="17" />
          <span className="flex-1">사진 로드에 실패했어요.</span>
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer font-bold text-[#a9c8ff] hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyUnclassified() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-3 py-10 text-center">
      <span className="text-muted grid size-16 place-items-center rounded-full bg-slate-100">
        <CheckIcon size="28" />
      </span>
      <h2 className="mt-4 text-[15px] font-extrabold">확인할 사진이 없어요</h2>
      <p className="text-muted mt-1.5 text-xs">모든 사진이 장소 폴더에 정리되어 있어요.</p>
    </div>
  );
}
