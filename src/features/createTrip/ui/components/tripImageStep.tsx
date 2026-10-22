'use client';

import { useCallback, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/toast';

import { validateImageSelection } from '../../model/imageValidation';
import type { TripCreateFormValues } from '../../model/types';
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

  const [brokenFiles, setBrokenFiles] = useState<ReadonlySet<File>>(() => new Set());
  const brokenCount = field.value.filter((file) => brokenFiles.has(file)).length;
  const markPreviewBroken = useCallback((file: File, broken: boolean) => {
    setBrokenFiles((previous) => {
      if (previous.has(file) === broken) return previous;
      const next = new Set(previous);
      if (broken) next.add(file);
      else next.delete(file);
      return next;
    });
  }, []);

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
      title="사진을 올려주세요"
      description="순서 상관없이 올려주시면 장소별로 정리해드릴게요."
      onBack={onBack}
      fixedFooter
      contentScrollable={false}
      footer={
        <Button
          type="submit"
          className={`w-full ${tripCreateButtonClassName}`}
          disabled={field.value.length === 0 || brokenCount > 0 || isCheckingLocation}
        >
          {isCheckingLocation ? '위치 정보 확인 중…' : '여행 만들기'}
        </Button>
      }
    >
      <ImageUploadField
        files={field.value}
        error={
          fieldState.error?.message ??
          (brokenCount > 0
            ? `열 수 없는 사진 ${brokenCount}장이 있어요. 삭제한 뒤 여행을 만들어주세요.`
            : undefined)
        }
        onSelect={selectFiles}
        onRemove={removeFile}
        onPreviewBrokenChange={markPreviewBroken}
      />
    </TripCreateStepLayout>
  );
}
