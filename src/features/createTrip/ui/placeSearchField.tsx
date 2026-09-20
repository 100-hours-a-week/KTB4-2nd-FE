import type { PlaceCandidate } from '../model/types';

type PlaceSearchFieldProps = {
  query: string;
  candidates: PlaceCandidate[];
  selectedPlaces: PlaceCandidate[];
  onQueryChange: (value: string) => void;
  onSelect: (place: PlaceCandidate) => void;
};

export function PlaceSearchField({
  query,
  candidates,
  selectedPlaces,
  onQueryChange,
  onSelect,
}: PlaceSearchFieldProps) {
  const availableCandidates = candidates.filter(
    (candidate) => !selectedPlaces.some((place) => place.regionCode === candidate.regionCode),
  );

  return (
    <div>
      <label htmlFor="place-search" className="sr-only">
        여행지 검색
      </label>
      <input
        id="place-search"
        type="search"
        value={query}
        autoComplete="off"
        placeholder="시/군 단위로 검색해주세요"
        onChange={(event) => onQueryChange(event.target.value)}
        className="border-field-border text-brand placeholder:text-muted focus:border-brand min-h-12 w-full border-b-2 bg-transparent px-1 text-base outline-none"
      />

      {query.trim() && (
        <div className="mt-4 overflow-hidden rounded-xl bg-slate-100" aria-live="polite">
          {availableCandidates.length > 0 ? (
            <ul aria-label="여행지 검색 결과">
              {availableCandidates.map((candidate) => (
                <li key={candidate.regionCode}>
                  <button
                    type="button"
                    onClick={() => onSelect(candidate)}
                    className="text-brand focus-visible:outline-brand min-h-12 w-full cursor-pointer border-b border-white px-4 text-left text-sm font-medium last:border-b-0 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-inset"
                  >
                    {candidate.regionName}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted px-4 py-4 text-sm">검색 결과가 없어요.</p>
          )}
        </div>
      )}
    </div>
  );
}
