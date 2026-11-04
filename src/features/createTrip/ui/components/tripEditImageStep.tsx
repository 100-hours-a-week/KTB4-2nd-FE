'use client';

import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/toast';

import type { TripEditPhoto } from '../../api/getTripForEdit';
import { TRIP_IMAGE_MAX_COUNT, validateImageSelection } from '../../model/imageValidation';
import type { TripCreateFormValues } from '../../model/types';
import { ImageUploadField } from './imageUploadField';
import { ExistingTripPhotos } from './existingTripPhotos';
import { TripCreateStepLayout } from './tripCreateStepLayout';

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
    if (keptCount + result.files.length > TRIP_IMAGE_MAX_COUNT) {
      toast.error(`여행 하나에 사진은 최대 ${TRIP_IMAGE_MAX_COUNT}장까지 올릴 수 있어요.`);
      return;
    }

    field.onChange(result.files);
    if (result.duplicateCount > 0) {
      toast.info(`중복 사진 ${result.duplicateCount}장은 제외했어요.`);
    }
    if (result.emptyCount > 0) {
      toast.info(`내용이 비어 있는 파일 ${result.emptyCount}개는 제외했어요.`);
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
          className="w-full"
          isLoading={isSubmitting}
          loadingText="저장하는 중…"
        >
          수정 완료
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <ExistingTripPhotos
          existingPhotos={existingPhotos}
          removedPhotoIds={removedPhotoIds}
          disabled={isSubmitting}
          onToggleRemove={onToggleRemove}
        />

        <div className="mt-3 min-h-0 flex-1">
          <ImageUploadField
            files={field.value}
            disabled={isSubmitting}
            onSelect={selectFiles}
            onRemove={removeFile}
          />
        </div>
      </div>
    </TripCreateStepLayout>
  );
}
