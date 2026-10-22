'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { STORY_NOT_ALLOWED_MESSAGE, isStoryNotAllowedError } from '@/features/createStory';
import { storyCreateQueries } from '@/queryFactory';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { StoryFolderChoice } from './storyFolderChoice';

export function StoryFolderGrid({
  tripId,
  selectedIds,
  onToggle,
  onUnavailableSelected,
}: {
  tripId: number;
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** 저장해 둔 선택 중 사진이 0장이 되었거나 사라진 폴더를 알립니다. */
  onUnavailableSelected?: (ids: number[]) => void;
}) {
  const query = useInfiniteQuery(storyCreateQueries.sourceFolders(tripId));
  const [visibleCount, setVisibleCount] = useState(6);
  const root = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const folders = query.data?.pages.flatMap((page) => page.folders) ?? [];
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  const hasMore = visibleCount < folders.length || hasNextPage;

  // 임시 저장에서 복원한 선택은 그 사이 사진이 지워졌을 수 있어 최신 폴더 목록과 맞춥니다.
  // 0장 폴더는 비활성이라 사용자가 직접 선택을 풀 수 없습니다.
  // 목록에 없는 폴더는 아직 안 불러온 페이지에 있을 수 있어 끝까지 불러온 뒤에만 뺍니다.
  useEffect(() => {
    if (!query.data || !onUnavailableSelected) return;

    const loaded = new Map(
      query.data.pages.flatMap((page) => page.folders).map((folder) => [folder.id, folder]),
    );
    const unavailable = selectedIds.filter((id) => {
      const folder = loaded.get(id);
      return folder ? folder.photoCount === 0 : !hasNextPage;
    });
    if (unavailable.length > 0) onUnavailableSelected(unavailable);
  }, [hasNextPage, onUnavailableSelected, query.data, selectedIds]);
  useEffect(() => {
    if (!sentinel.current || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || isFetchingNextPage || isError) return;
        if (visibleCount < folders.length) setVisibleCount((count) => count + 6);
        else if (hasNextPage) void fetchNextPage();
      },
      { root: root.current, rootMargin: '80px' },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [
    hasMore,
    visibleCount,
    folders.length,
    hasNextPage,
    isFetchingNextPage,
    isError,
    fetchNextPage,
  ]);

  return (
    <div
      ref={root}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="스토리를 만들 폴더 목록"
      tabIndex={0}
    >
      {query.isPending ? (
        <div role="status" aria-label="폴더 불러오는 중" className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[0.94] rounded-[18px]" />
          ))}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3">
            {folders.slice(0, visibleCount).map((folder) => (
              <li key={folder.id}>
                <StoryFolderChoice
                  folder={folder}
                  selected={selectedIds.includes(folder.id)}
                  onToggle={() => onToggle(folder.id)}
                />
              </li>
            ))}
          </ul>
          {query.isError && isStoryNotAllowedError(query.error) ? (
            <div role="alert" className="py-8 text-center">
              <p className="text-muted mb-3 text-xs leading-5">{STORY_NOT_ALLOWED_MESSAGE}</p>
              <Link
                href={`/trips/${tripId}`}
                className="bg-surface-subtle text-brand inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold"
              >
                여행 상세로 돌아가기
              </Link>
            </div>
          ) : query.isError ? (
            <div role="alert" className="py-8 text-center">
              <p className="text-muted mb-3 text-xs">폴더를 불러오지 못했어요.</p>
              <Button variant="secondary" onClick={() => void query.refetch()} className="text-sm">
                다시 시도
              </Button>
            </div>
          ) : folders.length === 0 ? (
            <p className="text-muted py-16 text-center text-sm">
              스토리를 만들 폴더가 없어요.
              <br />
              사진을 정리한 뒤 다시 방문해 주세요.
            </p>
          ) : null}
          {hasMore && !query.isError && (
            <div ref={sentinel} className="pt-4 text-center">
              <Button
                variant="ghost"
                disabled={query.isFetchingNextPage}
                onClick={() => {
                  if (visibleCount < folders.length) setVisibleCount((count) => count + 6);
                  else void query.fetchNextPage();
                }}
                className="text-xs"
              >
                {query.isFetchingNextPage ? '불러오는 중...' : '폴더 더 보기'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
