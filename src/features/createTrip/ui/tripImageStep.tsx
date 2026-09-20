'use client';

import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/toast';

import { validateImageSelection } from '../model/imageValidation';
import type { TripCreateFormValues } from '../model/types';
import { ImageUploadField } from './imageUploadField';
import { TripCreateStepLayout } from './tripCreateStepLayout';

type TripImageStepProps = {
  onBack: () => void;
};

export function TripImageStep({ onBack }: TripImageStepProps) {
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
  };

  const removeFile = (targetIndex: number) => {
    field.onChange(field.value.filter((_, index) => index !== targetIndex));
  };

  return (
    <TripCreateStepLayout
      title="사진을 올려주세요"
      description="무작위로 제출해주셔도 정리해드릴게요."
      onBack={onBack}
      footer={
        <Button type="submit" className="w-full" disabled={field.value.length === 0}>
          여행 만들기
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
