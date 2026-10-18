export type SearchTab = 'folder' | 'photo';

export function ResultTab({
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
