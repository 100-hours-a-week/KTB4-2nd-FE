export function ViewModeToggle({ onMapClick }: { onMapClick: () => void }) {
  return (
    <div className="bg-surface-subtle mt-4 grid grid-cols-2 rounded-[12px] p-1">
      <button
        type="button"
        onClick={onMapClick}
        className="text-muted focus-visible:outline-brand flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] text-sm font-bold focus-visible:outline-2"
      >
        지도로 보기
        <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold">
          준비 중
        </span>
      </button>
      <button
        type="button"
        aria-pressed="true"
        className="bg-surface text-brand min-h-10 rounded-[9px] text-sm font-extrabold shadow-[0_2px_8px_rgba(2,23,48,0.08)]"
      >
        목록으로 보기
      </button>
    </div>
  );
}
