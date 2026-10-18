'use client';

import { useId, useState, type FormEvent } from 'react';

import {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
  normalizeSearchQuery,
} from '@/features/search';
import { CloseIcon } from '@/shared/ui/icons';

export function SearchForm({
  query,
  onSearch,
}: {
  query: string;
  onSearch: (query: string) => void;
}) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const [value, setValue] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  const [showLengthError, setShowLengthError] = useState(false);

  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setValue(query);
    setShowLengthError(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeSearchQuery(value);

    if (normalized.length < SEARCH_QUERY_MIN_LENGTH) {
      setShowLengthError(true);
      return;
    }

    setShowLengthError(false);
    (document.activeElement as HTMLElement | null)?.blur();
    onSearch(normalized);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="mt-5 shrink-0">
      <label htmlFor={inputId} className="sr-only">
        검색어
      </label>
      <div
        className={`bg-surface flex min-h-[52px] items-center gap-2.5 rounded-[16px] border px-4 shadow-[0_2px_8px_rgba(2,23,48,0.03)] transition-colors focus-within:border-brand ${showLengthError ? 'border-danger' : 'border-border-subtle'}`}
      >
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
            <CloseIcon strokeWidth="2.6" strokeLinecap="round" size="12" />
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
