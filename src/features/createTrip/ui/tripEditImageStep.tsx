'use client';

import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/toast';

import type { TripEditPhoto } from '../api/getTripForEdit';
import { TRIP_IMAGE_MAX_COUNT, validateImageSelection } from '../model/imageValidation';
import type { TripCreateFormValues } from '../model/types';
import { ImageUploadField } from './imageUploadField';
import { tripCreateButtonClassName, TripCreateStepLayout } from './tripCreateStepLayout';

type TripEditImageStepProps = {
  existingPhotos: TripEditPhoto[];
  removedPhotoIds: Set<number>;
  onToggleRemove: (photoId: number) => void;
  onBack: () => void;
  isSubmitting: boolean;
};

export function TripEditImageStep({
  existingPhotos,
  removedPhotoIds,
  onToggleRemove,
  onBack,
  isSubmitting,
}: TripEditImageStepProps) {
  const { control } = useFormContext<TripCreateFormValues>();
  const { field } = useController({ control, name: 'attachments' });
  const keptCount = existingPhotos.length - removedPhotoIds.size;

  const selectFiles = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const result = validateImageSelection(field.value, selectedFiles);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    // 백엔드는 남겨둔 기존 사진과 새 사진을 합쳐 200장까지 받습니다.
    if (keptCount + result.files.length > TRIP_IMAGE_MAX_COUNT) {
      toast.error(`여행 하나에 사진은 최대 ${TRIP_IMAGE_MAX_COUNT}장까지 올릴 수 있어요.`);
      return;
    }

    field.onChange(result.files);
    if (result.duplicateCount > 0) {
      toast.info(`중복 사진 ${result.duplicateCount}장은 제외했어요.`);
    }
  };

  const removeFile = (targetIndex: number) => {
    field.onChange(field.value.filter((_, index) => index !== targetIndex));
  };

  return (
    <TripCreateStepLayout
      step="images"
      title="사진을 수정해주세요"
      description="지울 사진은 눌러서 표시하고, 새 사진은 아래에 추가해주세요."
      onBack={onBack}
      fixedFooter
      contentScrollable={false}
      footer={
        <Button
          type="submit"
          className={`w-full ${tripCreateButtonClassName}`}
          isLoading={isSubmitting}
          loadingText="저장하는 중…"
        >
          수정 완료
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <section aria-labelledby="existing-photos-title" className="shrink-0">
          <div className="flex items-end justify-between gap-3">
            <p id="existing-photos-title" className="text-brand text-sm font-bold">
              기존 사진
            </p>
            <span className="text-muted text-xs tabular-nums">
              {existingPhotos.length}장
              {removedPhotoIds.size > 0 && (
                <>
                  {' · '}
                  <strong className="text-danger-strong">{removedPhotoIds.size}장 삭제 예정</strong>
                </>
              )}
            </span>
          </div>
          {existingPhotos.length === 0 ? (
            <p className="text-muted mt-2 text-xs">아직 올린 사진이 없어요.</p>
          ) : (
            <ul
              aria-label="기존 사진 목록"
              className="mt-2 flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {existingPhotos.map((photo, index) => {
                const removed = removedPhotoIds.has(photo.id);
                return (
                  <li key={photo.id} className="shrink-0">
                    <button
                      type="button"
                      aria-pressed={removed}
                      aria-label={`${index + 1}번째 기존 사진 ${removed ? '삭제 취소' : '삭제'}`}
                      disabled={isSubmitting}
                      onClick={() => onToggleRemove(photo.id)}
                      className="focus-visible:outline-brand relative block size-[72px] cursor-pointer overflow-hidden rounded-lg bg-[#eef3f9] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
                    >
                      {photo.thumbnailUrl && (
                        <span
                          aria-hidden="true"
                          className={`block size-full bg-cover bg-center transition-opacity ${removed ? 'opacity-35' : ''}`}
                          style={{ backgroundImage: `url(${JSON.stringify(photo.thumbnailUrl)})` }}
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className={`absolute top-1 right-1 grid size-5 place-items-center rounded-full text-[11px] font-bold text-white ${removed ? 'bg-danger-strong' : 'bg-black/45'}`}
                      >
                        {removed ? '↺' : '✕'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="mt-3 min-h-0 flex-1">
          <ImageUploadField files={field.value} onSelect={selectFiles} onRemove={removeFile} />
        </div>
      </div>
    </TripCreateStepLayout>
  );
}
