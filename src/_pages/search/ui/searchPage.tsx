'use client';

import { useRouter } from 'next/navigation';

import { AiUnavailableDialog, useAiReadyGuard } from '@/features/aiStatus';
import { useSearch } from '@/features/search';
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
  const { result, viewState, errorMessage, refetch } = useSearch(query);
  const aiGuard = useAiReadyGuard();

  function search(value: string) {
    void aiGuard.runWhenAiReady(() => router.push(`/search?q=${encodeURIComponent(value)}`));
  }

  return (
    <main className="text-brand bg-app-background relative mx-auto flex h-[min(100dvh,var(--app-max-height))] w-full max-w-[430px] flex-col overflow-hidden px-5 pt-[max(32px,env(safe-area-inset-top))] pb-[calc(61px+max(8px,env(safe-area-inset-bottom)))]">
      <header className="shrink-0">
        <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.03em]">검색</h1>
        <p className="text-muted mt-1.5 text-xs">
          그때 어디서, 무엇을 찍었는지 말하듯 검색해보세요.
        </p>
      </header>

      <SearchForm query={query} onSearch={search} />

      {aiGuard.isChecking ? (
        <SearchSkeleton showError={false} errorMessage="" onRetry={() => undefined} />
      ) : viewState === 'idle' ? null : viewState === 'ready' && result ? (
        <SearchResults key={result.query} result={result} />
      ) : (
        <SearchSkeleton
          showError={viewState === 'error'}
          errorMessage={errorMessage}
          onRetry={() => void refetch()}
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
