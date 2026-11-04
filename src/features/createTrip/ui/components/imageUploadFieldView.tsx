import { useId, type ReactNode, type Ref } from 'react';

import { IconButton } from '@/shared/ui/iconButton';
import { CloseIcon, PlusIcon } from '@/shared/ui/icons';

import { TRIP_IMAGE_MAX_COUNT } from '../../model/imageValidation';

export type ImageUploadItem = {
  id: string;
  fileName: string;
  preview: ReactNode;
  ref?: Ref<HTMLLIElement>;
};

type ImageUploadFieldViewProps = {
  items: ImageUploadItem[];
  error?: string;
  disabled?: boolean;
  scrollRootRef?: Ref<HTMLDivElement>;
  onSelect: (files: File[]) => void;
  onRemove: (index: number) => void;
};

export function ImageUploadFieldView({
  items,
  error,
  disabled = false,
  scrollRootRef,
  onSelect,
  onRemove,
}: ImageUploadFieldViewProps) {
  const inputId = useId();
  const errorId = useId();

  return (
    <div className="flex h-full min-h-0 flex-col" aria-busy={disabled || undefined}>
      <div className="flex shrink-0 items-end justify-between gap-3">
        <div>
          <p className="text-brand text-sm font-bold">선택한 사진</p>
          <p className="text-muted mt-0.5 text-[11px]">JPG, PNG, HEIC 사진을 올릴 수 있어요</p>
        </div>
        <span className="text-muted inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#eef3f9] px-2.5 text-xs leading-none whitespace-nowrap tabular-nums">
          <strong className="text-brand">{items.length}</strong> / {TRIP_IMAGE_MAX_COUNT}장
        </span>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      )}
      <div
        ref={scrollRootRef}
        role="region"
        aria-label="선택한 사진 스크롤 영역"
        className="mt-3 min-h-0 flex-1 overflow-y-auto pb-2"
      >
        <ul className="grid grid-cols-3 gap-1.5" aria-label="선택한 사진 목록">
          <li role="presentation" className="aspect-square">
            <label
              htmlFor={inputId}
              className={`text-brand has-[:focus-visible]:ring-brand flex size-full flex-col items-center justify-center gap-1.5 rounded-control bg-[#eef3f9] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[#e3eaf3]'}`}
            >
              <PlusIcon aria-hidden="true" strokeWidth="2" strokeLinecap="round" size="22" />
              <span className="text-xs font-semibold">사진 추가</span>
              <input
                id={inputId}
                type="file"
                aria-label="여행 사진 추가"
                aria-describedby={error ? errorId : undefined}
                accept="image/jpeg,image/png,image/heic,.jpg,.jpeg,.png,.heic"
                multiple
                disabled={disabled}
                onChange={(event) => {
                  if (!disabled) onSelect(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
                className="sr-only"
              />
            </label>
          </li>
          {items.map((item, index) => (
            <li
              key={item.id}
              ref={item.ref}
              className="relative aspect-square overflow-hidden rounded-control bg-slate-100"
            >
              {item.preview}
              <IconButton
                tone="inverse"
                aria-label={`${item.fileName} 삭제`}
                disabled={disabled}
                onClick={() => onRemove(index)}
                className="group absolute top-0 right-0"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/45 backdrop-blur-sm group-hover:bg-black/65"
                >
                  <CloseIcon strokeWidth="2.6" strokeLinecap="round" size="11" />
                </span>
              </IconButton>
            </li>
          ))}
          {items.length === 0 &&
            Array.from({ length: 5 }, (_, index) => (
              <li
                key={index}
                role="presentation"
                aria-hidden="true"
                className="bg-surface-subtle aspect-square rounded-control"
              />
            ))}
        </ul>
        {items.length === 0 && (
          <p className="text-muted mt-4 text-center text-xs">
            위치 정보가 담긴 사진이면 장소별 폴더로 나눠드려요.
          </p>
        )}
      </div>
    </div>
  );
}
