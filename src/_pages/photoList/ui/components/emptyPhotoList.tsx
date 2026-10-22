import { Button } from '@/shared/ui/button';
import { ImageIcon } from '@/shared/ui/icons';

export function EmptyPhotoList({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="flex min-h-[68vh] flex-col items-center justify-center text-center">
      <span className="text-muted grid size-16 place-items-center rounded-full bg-slate-100">
        <ImageIcon strokeWidth="1.7" size="32" />
      </span>
      <h2 className="mt-4 text-base font-extrabold">폴더에 사진이 없어요</h2>
      <p className="text-muted mt-1 text-xs">사진을 추가해보세요!</p>
      <Button onClick={onAdd} className="mt-5 min-h-10 rounded-full px-5 text-sm">
        ＋ 사진 추가
      </Button>
    </section>
  );
}
