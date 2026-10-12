'use client';

import { useEffect, useState } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';

import { toast } from '@/shared/ui/toast';

import { readStoryCreateDraft, updateStoryCreateDraft } from './storyCreateDraft';
import { STORY_FOLDER_LIMIT, type StoryCreateFormValues } from './types';

export function useStoryCreateForm(tripId: number) {
  const [initialDraft] = useState(() => readStoryCreateDraft(tripId));
  const { control, getValues, setValue, subscribe } = useForm<StoryCreateFormValues>({
    defaultValues: { mood: initialDraft.mood, tripPlaceIds: initialDraft.tripPlaceIds },
  });
  const {
    field: { value: mood, onChange: setMood },
  } = useController({ control, name: 'mood', rules: { required: true } });
  const selectedIds = useWatch({ control, name: 'tripPlaceIds' });

  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) =>
          updateStoryCreateDraft(tripId, {
            mood: values.mood,
            tripPlaceIds: values.tripPlaceIds,
          }),
      }),
    [subscribe, tripId],
  );

  function toggleFolder(id: number) {
    if (selectedIds.includes(id)) {
      setValue(
        'tripPlaceIds',
        selectedIds.filter((selectedId) => selectedId !== id),
      );
      return;
    }
    if (selectedIds.length >= STORY_FOLDER_LIMIT) {
      toast.warning('폴더는 최대 10개까지 선택할 수 있어요.');
      return;
    }
    setValue('tripPlaceIds', [...selectedIds, id]);
  }

  return {
    mood,
    setMood,
    selectedIds,
    toggleFolder,
    clearFolders: () => setValue('tripPlaceIds', []),
    getValues,
  };
}
