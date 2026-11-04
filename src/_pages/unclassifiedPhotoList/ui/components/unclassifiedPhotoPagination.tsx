import type { Ref } from 'react';

import { PhotoGridSkeletonTiles } from '@/_pages/photoList/ui/components/photoGridSkeleton';
import { Button } from '@/shared/ui/button';

type UnclassifiedPhotoPaginationProps = {
  ref: Ref<HTMLDivElement>;
  isLoading: boolean;
  hasError: boolean;
  disabled: boolean;
  onLoadMore: () => void;
};

export function UnclassifiedPhotoPagination({
  ref,
  isLoading,
  hasError,
  disabled,
  onLoadMore,
}: UnclassifiedPhotoPaginationProps) {
  return (
    <div ref={ref} className="mt-1 pb-4 text-center">
      {hasError && (
        <p role="alert" className="mb-2 text-sm text-red-700">
          사진을 더 불러오지 못했어요. 이미 불러온 사진은 볼 수 있어요.
        </p>
      )}
      {isLoading && (
        <div role="status" aria-label="사진 추가 로딩 중" aria-busy="true">
          <PhotoGridSkeletonTiles count={6} />
          <p className="my-2 text-sm text-slate-500">사진을 더 불러오는 중…</p>
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        isLoading={isLoading}
        loadingText="사진 불러오는 중…"
        className="mt-3"
        onClick={onLoadMore}
      >
        {hasError ? '사진 추가 로딩 다시 시도' : '사진 더 불러오기'}
      </Button>
    </div>
  );
}
