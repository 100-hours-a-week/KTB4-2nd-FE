'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AiUnavailableDialog, useAiReadyGuard } from '@/features/aiStatus';
import { isSearchableQuery, useSearch } from '@/features/search';
import { searchQueries } from '@/queryFactory';
import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottomNavigation';

import { SearchForm } from './components/searchForm';
import { SearchResults } from './components/searchResults';
import { SearchSkeleton } from './components/searchSkeleton';

const navigationItems: BottomNavigationItem[] = [
  { id: 'home', label: '홈', icon: 'home', href: '/' },
  { id: 'list', label: '목록', icon: 'list', href: '/trips' },
  {
    id: 'create',
    label: '새 기록 추가',
    icon: 'plus',
    href: '/trips/create?step=name',
    action: true,
  },
  { id: 'search', label: '검색', icon: 'search', href: '/search' },
  { id: 'profile', label: '마이페이지', icon: 'profile', href: '/mypage' },
];

export type SearchPageProps = {
  query: string;
};

export function SearchPage({ query }: SearchPageProps) {
  const router = useRouter();
  const aiGuard = useAiReadyGuard();
  const { runWhenAiReady } = aiGuard;
  const queryClient = useQueryClient();
  // 상세 화면에서 뒤로가기로 돌아왔을 때 이미 받은 결과가 있으면 AI 확인 없이 바로 보여줍니다.
  const [allowedQuery, setAllowedQuery] = useState<string | null>(() =>
    queryClient.getQueryData(searchQueries.resultKeys(query)) ? query : null,
  );
  const [blockedQuery, setBlockedQuery] = useState<string | null>(null);
  const { result, viewState, errorMessage, refetch } = useSearch(query, allowedQuery === query);

  useEffect(() => {
    if (!isSearchableQuery(query) || allowedQuery === query) return;

    void runWhenAiReady(() => setAllowedQuery(query)).then((outcome) => {
      if (outcome === 'blocked') setBlockedQuery(query);
    });
  }, [query, allowedQuery, runWhenAiReady]);

  function searchAgain() {
    void runWhenAiReady(() => {
      setBlockedQuery(null);
      if (allowedQuery === query) void refetch();
      else setAllowedQuery(query);
    }).then((outcome) => {
      if (outcome === 'blocked') setBlockedQuery(query);
    });
  }

  function search(value: string) {
    if (value === query) {
      searchAgain();
      return;
    }
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  const blocked = blockedQuery === query && allowedQuery !== query;

  return (
    <main className="text-brand bg-app-background relative mx-auto flex h-[min(100dvh,var(--app-max-height))] w-full max-w-[430px] flex-col overflow-hidden px-5 pt-[max(32px,env(safe-area-inset-top))] pb-[calc(61px+max(8px,env(safe-area-inset-bottom)))]">
      <header className="shrink-0">
        <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.03em]">검색</h1>
        <p className="text-muted mt-1.5 text-xs">
          그때 어디서, 무엇을 찍었는지 말하듯 검색해보세요.
        </p>
      </header>

      <SearchForm query={query} onSearch={search} />

      {viewState === 'idle' ? null : viewState === 'ready' && result && !aiGuard.isChecking ? (
        <SearchResults key={result.query} result={result} />
      ) : (
        <SearchSkeleton
          showError={!aiGuard.isChecking && (blocked || viewState === 'error')}
          errorMessage={
            blocked ? '지금은 AI 검색을 사용할 수 없어요. 잠시 후 다시 시도해주세요.' : errorMessage
          }
          onRetry={searchAgain}
        />
      )}

      <BottomNavigation items={navigationItems} activeId="search" />
      <AiUnavailableDialog
        reason={aiGuard.unavailableReason}
        onClose={aiGuard.closeUnavailableDialog}
      />
    </main>
  );
}
