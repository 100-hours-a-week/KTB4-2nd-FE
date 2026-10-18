import { SearchIcon } from '@/shared/ui/icons';

export function EmptySearchResult() {
  return (
    <section className="flex min-h-[46vh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-full bg-slate-200/55 text-slate-500">
        <SearchIcon strokeWidth="2" strokeLinecap="round" size={28} />
      </span>
      <h2 className="mt-5 text-[15px] font-extrabold">검색 결과가 없어요.</h2>
      <p className="text-muted mt-1 text-xs">장소나 상황을 다른 말로 검색해보세요.</p>
    </section>
  );
}
