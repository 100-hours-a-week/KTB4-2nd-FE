import { CloseIcon, PinIcon, SearchIcon } from '@/shared/ui/icons';

import type { PlaceCandidate } from '../../model/types';

type PlaceSearchFieldProps = {
  query: string;
  candidates: PlaceCandidate[];
  status: 'idle' | 'loading' | 'error' | 'success';
  selectedPlaces: PlaceCandidate[];
  onQueryChange: (value: string) => void;
  onSelect: (place: PlaceCandidate) => void;
};

export function PlaceSearchField({
  query,
  candidates,
  status,
  selectedPlaces,
  onQueryChange,
  onSelect,
}: PlaceSearchFieldProps) {
  const availableCandidates = candidates.filter(
    (candidate) => !selectedPlaces.some((place) => place.regionCode === candidate.regionCode),
  );

  return (
    <div className="flex min-h-0 flex-col">
      <label htmlFor="place-search" className="sr-only">
        여행지 검색
      </label>
      <div className="bg-surface border-border-subtle focus-within:border-brand flex min-h-[52px] shrink-0 items-center gap-2.5 rounded-[16px] border px-4 shadow-[0_2px_8px_rgba(2,23,48,0.03)] transition-colors">
        <span className="text-muted shrink-0">
          <SearchIcon strokeWidth="2" strokeLinecap="round" size={19} />
        </span>
        <input
          id="place-search"
          type="search"
          value={query}
          autoComplete="off"
          placeholder="시/군 이름으로 검색해주세요"
          onChange={(event) => onQueryChange(event.target.value)}
          className="text-brand placeholder:text-muted/70 min-w-0 flex-1 bg-transparent py-3 text-sm font-medium outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => onQueryChange('')}
            className="text-muted hover:text-brand focus-visible:outline-brand grid size-7 shrink-0 cursor-pointer place-items-center rounded-full bg-slate-100 transition-colors focus-visible:outline-2"
          >
            <CloseIcon strokeWidth="2.6" strokeLinecap="round" size="12" />
          </button>
        )}
      </div>

      {query.trim() && (
        <div
          className="border-border-subtle mt-2 min-h-0 overflow-y-auto overscroll-contain rounded-2xl border shadow-[0_8px_24px_rgba(2,23,48,0.06)]"
          aria-live="polite"
        >
          {status === 'idle' ? (
            <SearchMessage>띄어쓰기 없이 한글로 입력해주세요.</SearchMessage>
          ) : status === 'loading' ? (
            <SearchMessage>검색하고 있어요…</SearchMessage>
          ) : status === 'error' ? (
            <SearchMessage>검색하지 못했어요. 잠시 후 다시 시도해주세요.</SearchMessage>
          ) : availableCandidates.length > 0 ? (
            <ul aria-label="여행지 검색 결과" className="divide-border-subtle divide-y">
              {availableCandidates.map((candidate) => (
                <li key={candidate.regionCode}>
                  <button
                    type="button"
                    onClick={() => onSelect(candidate)}
                    className="text-brand hover:bg-surface-subtle focus-visible:outline-brand flex min-h-12 w-full cursor-pointer items-center gap-2.5 px-4 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                  >
                    <PinIcon className="text-muted shrink-0" size={16} strokeWidth="2" />
                    {candidate.regionName}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <SearchMessage>검색 결과가 없어요.</SearchMessage>
          )}
        </div>
      )}
    </div>
  );
}

function SearchMessage({ children }: { children: string }) {
  return <p className="text-muted px-4 py-4 text-[13px]">{children}</p>;
}
