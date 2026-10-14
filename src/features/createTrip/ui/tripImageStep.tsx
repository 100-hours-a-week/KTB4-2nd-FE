'use client';

import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/toast';

import { validateImageSelection } from '../model/imageValidation';
import type { TripCreateFormValues } from '../model/types';
import { ImageUploadField } from './imageUploadField';
import { tripCreateButtonClassName, TripCreateStepLayout } from './tripCreateStepLayout';

type TripImageStepProps = {
  onBack: () => void;
  isCheckingLocation?: boolean;
};

export function TripImageStep({ onBack, isCheckingLocation = false }: TripImageStepProps) {
  const { control } = useFormContext<TripCreateFormValues>();
  const { field, fieldState } = useController({
    control,
    name: 'attachments',
    rules: {
      validate: (files) => files.length > 0 || '사진을 한 장 이상 선택해주세요.',
    },
  });

  const selectFiles = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const result = validateImageSelection(field.value, selectedFiles);
    if (!result.ok) {
      toast.error(result.message);
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
      title="사진을 올려주세요"
      description="순서 상관없이 올려주시면 장소별로 정리해드릴게요."
      onBack={onBack}
      fixedFooter
      contentScrollable={false}
      footer={
        <Button
          type="submit"
          className={`w-full ${tripCreateButtonClassName}`}
          disabled={field.value.length === 0 || isCheckingLocation}
        >
          {isCheckingLocation ? '위치 정보 확인 중…' : '여행 만들기'}
        </Button>
      }
    >
      <ImageUploadField
        files={field.value}
        error={fieldState.error?.message}
        onSelect={selectFiles}
        onRemove={removeFile}
      />
    </TripCreateStepLayout>
  );
}
