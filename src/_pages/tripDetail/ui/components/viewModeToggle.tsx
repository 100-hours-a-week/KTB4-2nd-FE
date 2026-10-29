export type TripDetailViewMode = 'map' | 'list';

const OPTIONS: { mode: TripDetailViewMode; label: string }[] = [
  { mode: 'map', label: '지도로 보기' },
  { mode: 'list', label: '목록으로 보기' },
];

export function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: TripDetailViewMode;
  onChange: (mode: TripDetailViewMode) => void;
}) {
  return (
    <div className="bg-surface-subtle mt-4 grid grid-cols-2 rounded-[12px] p-1">
      {OPTIONS.map((option) => {
        const selected = option.mode === mode;
        return (
          <button
            key={option.mode}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.mode)}
            className={`focus-visible:outline-brand min-h-10 cursor-pointer rounded-[9px] text-sm transition-colors focus-visible:outline-2 ${
              selected
                ? 'bg-surface text-brand font-extrabold shadow-[0_2px_8px_rgba(2,23,48,0.08)]'
                : 'text-muted font-bold'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
