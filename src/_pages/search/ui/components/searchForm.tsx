'use client';

import { useState, type FormEvent } from 'react';

import {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
  isSearchableQuery,
  normalizeSearchQuery,
} from '@/features/search';
import { SearchField } from '@/shared/ui/searchField';

export function SearchForm({
  query,
  onSearch,
}: {
  query: string;
  onSearch: (query: string) => void;
}) {
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

    if (!isSearchableQuery(normalized)) {
      setShowLengthError(true);
      return;
    }

    setShowLengthError(false);
    (document.activeElement as HTMLElement | null)?.blur();
    onSearch(normalized);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="mt-5 shrink-0">
      <SearchField
        label="검색어"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        maxLength={SEARCH_QUERY_MAX_LENGTH * 2}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          if (showLengthError) setShowLengthError(false);
        }}
        placeholder="제주도에서 빨간 옷 입었을 때가 언제야?"
        error={
          showLengthError ? `검색어를 ${SEARCH_QUERY_MIN_LENGTH}글자 이상 입력해주세요.` : undefined
        }
      />
    </form>
  );
}
