'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';

import type { PhotoAccent } from '@/features/photoList';
import {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
  normalizeSearchQuery,
  useSearch,
  type SearchFolder,
  type SearchPhoto,
  type SearchResult,
} from '@/features/search';
import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottomNavigation';
import { Skeleton } from '@/shared/ui/skeleton';

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

const EXAMPLE_QUERIES = [
  '제주도에서 빨간 옷 입었을 때가 언제야',
  '바다 보면서 저녁 먹은 날',
  '친구들이랑 단체 사진 찍은 곳',
];

type SearchTab = 'folder' | 'photo';

export type SearchPageProps = {
  query: string;
};

export function SearchPage({ query }: SearchPageProps) {
  const router = useRouter();
  const { result, viewState, refetch } = useSearch(query);

  function search(value: string) {
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <main className="text-brand bg-app-background relative mx-auto min-h-dvh w-full max-w-[430px] px-5 pt-[max(32px,env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))]">
      <header>
        <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.03em]">검색</h1>
        <p className="text-muted mt-1.5 text-xs">
          그때 어디서, 무엇을 찍었는지 말하듯 검색해보세요.
        </p>
      </header>

      {/* 뒤로가기로 검색어가 바뀌면 입력창도 그 검색어로 다시 맞춥니다. */}
      <SearchForm key={query} initialValue={query} onSearch={search} />

      {viewState === 'idle' ? (
        <SearchExamples onSelect={search} />
      ) : viewState === 'ready' && result ? (
        <SearchResults key={result.query} result={result} />
      ) : (
        <SearchSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
      )}

      <BottomNavigation items={navigationItems} activeId="search" />
    </main>
  );
}

function SearchForm({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (query: string) => void;
}) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const [value, setValue] = useState(initialValue);
  const [showLengthError, setShowLengthError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeSearchQuery(value);

    if (normalized.length < SEARCH_QUERY_MIN_LENGTH) {
      setShowLengthError(true);
      return;
    }

    setShowLengthError(false);
    // 같은 검색어를 다시 제출해도 키보드는 내려가도록 포커스를 해제합니다.
    (document.activeElement as HTMLElement | null)?.blur();
    onSearch(normalized);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="mt-5">
      <label htmlFor={inputId} className="sr-only">
        검색어
      </label>
      <div
        className={`bg-surface flex min-h-[52px] items-center gap-2.5 rounded-[16px] border px-4 shadow-[0_2px_8px_rgba(2,23,48,0.03)] transition-colors focus-within:border-brand ${showLengthError ? 'border-danger' : 'border-border-subtle'}`}
      >
        <span className="text-muted shrink-0">
          <SearchIcon />
        </span>
        <input
          id={inputId}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          maxLength={SEARCH_QUERY_MAX_LENGTH}
          onChange={(event) => {
            setValue(event.target.value);
            if (showLengthError) setShowLengthError(false);
          }}
          placeholder="제주도에서 빨간 옷 입었을 때가 언제야?"
          aria-invalid={showLengthError || undefined}
          aria-describedby={showLengthError ? messageId : undefined}
          className="placeholder:text-muted/70 min-w-0 flex-1 bg-transparent py-3 text-sm font-medium outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => setValue('')}
            className="text-muted hover:text-brand focus-visible:outline-brand grid size-7 shrink-0 cursor-pointer place-items-center rounded-full bg-slate-100 transition-colors focus-visible:outline-2"
          >
            <ClearIcon />
          </button>
        )}
      </div>
      {showLengthError && (
        <p id={messageId} role="alert" className="text-danger mt-2 px-1 text-xs font-medium">
          검색어를 {SEARCH_QUERY_MIN_LENGTH}글자 이상 입력해주세요.
        </p>
      )}
    </form>
  );
}

function SearchExamples({ onSelect }: { onSelect: (query: string) => void }) {
  return (
    <section aria-labelledby="search-examples-title" className="mt-7">
      <h2 id="search-examples-title" className="text-muted px-1 text-xs font-bold">
        이렇게 검색해보세요
      </h2>
      <ul className="mt-2.5 space-y-2">
        {EXAMPLE_QUERIES.map((example) => (
          <li key={example}>
            <button
              type="button"
              onClick={() => onSelect(example)}
              className="border-border-subtle bg-surface hover:bg-surface-subtle focus-visible:outline-brand flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-[14px] border px-4 text-left text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="text-muted shrink-0">
                <SearchIcon size={15} />
              </span>
              <span className="min-w-0 flex-1 truncate">{example}</span>
              <span className="text-muted shrink-0">
                <ChevronIcon />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SearchResults({ result }: { result: SearchResult }) {
  const [selectedTab, setSelectedTab] = useState<SearchTab | null>(null);
  const isEmpty = result.folders.length === 0 && result.photos.length === 0;
  // 사진 결과가 없을 때는 폴더 탭부터 보여줍니다.
  const tab: SearchTab =
    selectedTab ?? (result.photos.length === 0 && result.folders.length > 0 ? 'folder' : 'photo');

  return (
    <>
      <AnswerCard answer={result.answer} answerError={result.answerError} />

      {isEmpty ? (
        <EmptySearchResult />
      ) : (
        <>
          <div
            role="tablist"
            aria-label="검색 결과 종류"
            className="border-border-subtle mt-6 flex gap-5 border-b"
          >
            <ResultTab
              id="folder"
              label="폴더"
              count={result.folders.length}
              selected={tab === 'folder'}
              onSelect={() => setSelectedTab('folder')}
            />
            <ResultTab
              id="photo"
              label="사진"
              count={result.photos.length}
              selected={tab === 'photo'}
              onSelect={() => setSelectedTab('photo')}
            />
          </div>

          <div role="tabpanel" id={`search-panel-${tab}`} aria-labelledby={`search-tab-${tab}`}>
            {tab === 'folder' ? (
              <FolderResults folders={result.folders} />
            ) : (
              <PhotoResults photos={result.photos} />
            )}
          </div>
        </>
      )}
    </>
  );
}

function AnswerCard({
  answer,
  answerError,
}: {
  answer: string | null;
  answerError: string | null;
}) {
  if (!answer && !answerError) return null;

  return (
    <section
      aria-label="AI의 한 줄 답변"
      className="border-border-subtle bg-surface mt-4 rounded-[18px] border px-4 py-4 shadow-[0_2px_8px_rgba(2,23,48,0.03)]"
    >
      <h2 className="flex items-center gap-1.5 text-[13px] font-extrabold">
        <span className="text-[#3973b9]">
          <SparkleIcon />
        </span>
        AI의 한 줄 답변
      </h2>
      {answer ? (
        <p className="mt-2 text-[15px] leading-snug font-bold">{answer}</p>
      ) : (
        <p className="text-muted mt-2 text-xs">
          답변을 만들지 못했어요. 아래 검색 결과를 확인해보세요.
        </p>
      )}
    </section>
  );
}

function ResultTab({
  id,
  label,
  count,
  selected,
  onSelect,
}: {
  id: SearchTab;
  label: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`search-tab-${id}`}
      aria-label={`${label} ${count}건`}
      aria-selected={selected}
      aria-controls={`search-panel-${id}`}
      onClick={onSelect}
      className={`focus-visible:outline-brand relative -mb-px flex min-h-11 cursor-pointer items-center gap-1 px-1 text-sm transition-colors focus-visible:outline-2 ${selected ? 'font-extrabold' : 'text-muted font-semibold'}`}
    >
      {label}
      <span className={`text-xs ${selected ? 'text-brand' : 'text-muted'}`}>{count}</span>
      {selected && (
        <span
          aria-hidden="true"
          className="bg-brand absolute inset-x-0 bottom-0 h-0.5 rounded-full"
        />
      )}
    </button>
  );
}

function FolderResults({ folders }: { folders: SearchFolder[] }) {
  if (folders.length === 0) return <EmptyTabResult message="일치하는 폴더가 없어요." />;

  return (
    <ul className="mt-4 space-y-2.5">
      {folders.map((folder, index) => (
        <li key={folder.tripId}>
          <Link
            href={`/trips/${folder.tripId}`}
            aria-label={`${folder.tripName} 여행 상세 보기`}
            className="border-border-subtle bg-surface focus-visible:outline-brand flex min-h-[106px] items-center rounded-[18px] border p-3 shadow-[0_2px_8px_rgba(2,23,48,0.03)] transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <FolderThumbnail folder={folder} colorIndex={index} />
            <span className="min-w-0 flex-1 py-0.5 pl-3">
              <strong className="block truncate text-sm font-extrabold tracking-[-0.01em]">
                {folder.tripName}
              </strong>
              <span className="text-muted mt-1 block truncate text-[11px]">
                {folder.regionNames.slice(0, 3).join(', ')}
              </span>
              <span className="text-muted mt-1 block truncate text-[11px]">
                {formatShortDate(folder.startDate)} - {formatShortDate(folder.endDate)}
              </span>
              <span className="text-muted mt-1 flex items-center gap-1 text-[11px]">
                <PhotoIcon /> 사진 {folder.photoCount}장
              </span>
            </span>
            <span className="text-muted shrink-0 pl-2">
              <ChevronIcon />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FolderThumbnail({ folder, colorIndex }: { folder: SearchFolder; colorIndex: number }) {
  if (folder.thumbnailUrl) {
    return (
      <span
        aria-hidden="true"
        className="block size-[82px] shrink-0 rounded-[13px] bg-slate-100 bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(folder.thumbnailUrl)})` }}
      />
    );
  }

  const gradients = [
    'from-[#273a63] via-[#4d638c] to-[#172743]',
    'from-[#f3d5a2] via-[#d87743] to-[#9d3f25]',
    'from-[#cfe5ed] via-[#8ebaa6] to-[#528b9e]',
  ];

  return (
    <span
      aria-hidden="true"
      className={`relative block size-[82px] shrink-0 overflow-hidden rounded-[13px] bg-gradient-to-br ${gradients[colorIndex % gradients.length]}`}
    >
      <span className="absolute right-[-10px] bottom-[-18px] size-16 rounded-full bg-white/20" />
      <span className="absolute bottom-3 left-3 h-1.5 w-12 rounded-full bg-white/30" />
    </span>
  );
}

function PhotoResults({ photos }: { photos: SearchPhoto[] }) {
  if (photos.length === 0) return <EmptyTabResult message="일치하는 사진이 없어요." />;

  return (
    <ul aria-label="사진 검색 결과" className="mt-4 grid grid-cols-3 gap-1">
      {photos.map((photo, index) => (
        <li key={photo.id}>
          <Link
            href={`/trips/${photo.tripId}/places/${photo.tripPlaceId}/photos`}
            aria-label={`${index + 1}번째 사진이 있는 폴더 보기`}
            className="focus-visible:outline-brand relative block aspect-square w-full overflow-hidden rounded-[5px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1"
          >
            <PhotoArtwork photo={photo} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PhotoArtwork({ photo }: { photo: SearchPhoto }) {
  if (photo.thumbnailUrl) {
    return (
      <span
        aria-hidden="true"
        className="block size-full bg-slate-100 bg-cover bg-center"
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
      <span className="absolute top-[14%] right-[14%] size-[17%] rounded-full bg-[#ffe59a]" />
      <span className="absolute -right-[8%] bottom-[-10%] h-[42%] w-[82%] rounded-[50%] bg-black/15" />
      <span className="absolute bottom-[-13%] -left-[10%] h-[48%] w-[92%] rounded-[50%] bg-white/18" />
    </span>
  );
}

function EmptySearchResult() {
  return (
    <section className="flex min-h-[46vh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-full bg-slate-200/55 text-slate-500">
        <SearchIcon size={28} />
      </span>
      <h2 className="mt-5 text-[15px] font-extrabold">검색 결과가 없어요.</h2>
      <p className="text-muted mt-1 text-xs">장소나 상황을 다른 말로 검색해보세요.</p>
    </section>
  );
}

function EmptyTabResult({ message }: { message: string }) {
  return (
    <p className="text-muted flex min-h-[200px] items-center justify-center text-xs">{message}</p>
  );
}

function SearchSkeleton({ showError, onRetry }: { showError: boolean; onRetry: () => void }) {
  return (
    <div
      role={showError ? undefined : 'status'}
      aria-label={showError ? undefined : '검색 중'}
      aria-busy={!showError}
    >
      <div className="border-border-subtle bg-surface mt-4 rounded-[18px] border px-4 py-4">
        <Skeleton animation={showError ? 'none' : 'pulse'} className="h-3 w-24" />
        <Skeleton animation={showError ? 'none' : 'pulse'} className="mt-3 h-4 w-48" />
      </div>
      <div className="border-border-subtle mt-6 flex gap-5 border-b pb-3">
        <Skeleton animation={showError ? 'none' : 'pulse'} className="h-4 w-10" />
        <Skeleton animation={showError ? 'none' : 'pulse'} className="h-4 w-10" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1">
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton
            key={index}
            animation={showError ? 'none' : 'breathe'}
            delayMs={(index % 3) * 120 + Math.floor(index / 3) * 60}
            className="aspect-square w-full rounded-[5px]"
          />
        ))}
      </div>
      {showError && (
        <div
          role="alert"
          className="bg-brand fixed right-5 bottom-[calc(var(--app-vertical-offset)+88px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto flex max-w-[390px] items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg"
        >
          <ErrorIcon />
          <span className="flex-1">검색 결과를 가져오지 못했어요.</span>
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer font-bold text-[#a9c8ff] underline-offset-2 hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}

function formatShortDate(date: string) {
  return date.slice(2).replaceAll('-', '.');
}

function SearchIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}
function ClearIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5c.5 4.6 2.4 6.5 7 7-4.6.5-6.5 2.4-7 7-.5-4.6-2.4-6.5-7-7 4.6-.5 6.5-2.4 7-7Z" />
      <path d="M19 15c.2 1.8.9 2.6 2.7 2.8-1.8.2-2.5.9-2.7 2.7-.2-1.8-.9-2.5-2.7-2.7 1.8-.2 2.5-1 2.7-2.8Z" />
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
function PhotoIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
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
function ErrorIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffb3a8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" />
    </svg>
  );
}
