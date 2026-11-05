'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { tripStoryQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { previewStoryTone } from '../api/previewStoryTone';
import { updateTripStory } from '../api/updateTripStory';
import {
  fromStoryContentResponse,
  getStoryEditError,
  createNewBlockKey,
  insertStoryEditBlock,
  removeStoryEditBlock,
  toStoryEditDraft,
  toStoryTonePreviewRequest,
  toStoryUpdateRequest,
  updateStoryEditBlock,
  type StoryEditBlock,
  type StoryEditDraft,
} from './storyEdit';
import { getStoryTonePreviewErrorMessage, getStoryUpdateErrorMessage } from './storyEditError';
import type { TripStoryMood, TripStoryResponse } from './types';

export function useTripStoryEdit(
  tripId: number,
  story: TripStoryResponse,
  { onSaved }: { onSaved: () => void },
) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<StoryEditDraft>(() => toStoryEditDraft(story));
  const [isDirty, setIsDirty] = useState(false);

  const save = useMutation({
    mutationFn: async (nextDraft: StoryEditDraft) => {
      const csrfToken = await fetchCsrfToken();
      return updateTripStory(nextDraft.storyId, toStoryUpdateRequest(nextDraft), csrfToken);
    },
    onSuccess: (response) => {
      queryClient.setQueryData(tripStoryQueries.detail(tripId).queryKey, {
        ...story,
        ...fromStoryContentResponse(response),
      });
      toast.success('스토리를 수정했어요.');
      onSaved();
    },
    onError: (error) => toast.error(getStoryUpdateErrorMessage(error)),
  });
  const tonePreview = useMutation({
    mutationFn: async ({ nextDraft, tone }: { nextDraft: StoryEditDraft; tone: TripStoryMood }) => {
      const csrfToken = await fetchCsrfToken();
      return previewStoryTone(
        nextDraft.storyId,
        toStoryTonePreviewRequest(nextDraft, tone),
        csrfToken,
      );
    },
    onSuccess: (response) => {
      setDraft(toStoryEditDraft(fromStoryContentResponse(response)));
      setIsDirty(true);
    },
    onError: (error) => toast.error(getStoryTonePreviewErrorMessage(error)),
  });

  function change(update: (current: StoryEditDraft) => StoryEditDraft) {
    setDraft(update);
    setIsDirty(true);
  }

  /** 입력값 때문에 저장을 막았으면 false를 돌려줍니다. */
  function submit() {
    if (save.isPending || tonePreview.isPending) return true;
    if (!isDirty) {
      onSaved();
      return true;
    }

    const error = getStoryEditError(draft);
    if (error) {
      toast.error(error);
      return false;
    }
    save.mutate(draft);
    return true;
  }

  function changeTone(tone: TripStoryMood) {
    if (tonePreview.isPending || save.isPending || tone === draft.mood) return;
    tonePreview.mutate({ nextDraft: draft, tone });
  }

  return {
    draft,
    isDirty,
    isSaving: save.isPending,
    isChangingTone: tonePreview.isPending,
    changeSummary: (storySummary: string) => change((current) => ({ ...current, storySummary })),
    changeDayLabel: (dayKey: string, dayLabel: string) =>
      change((current) => ({
        ...current,
        days: current.days.map((day) => (day.key === dayKey ? { ...day, dayLabel } : day)),
      })),
    changeBlock: (
      blockKey: string,
      patch: Partial<Pick<StoryEditBlock, 'detailSummary' | 'memo'>>,
    ) => change((current) => updateStoryEditBlock(current, blockKey, patch)),
    removeBlock: (blockKey: string) => change((current) => removeStoryEditBlock(current, blockKey)),
    replacePhoto: (
      blockKey: string,
      photo: Pick<StoryEditBlock, 'tripAttachmentId' | 'thumbnailUrl'>,
    ) => change((current) => updateStoryEditBlock(current, blockKey, photo)),
    /** 새 사진의 제목은 장소 이름으로 채워 두고, 문장은 비워 둡니다. */
    addPhoto: (
      dayKey: string,
      index: number,
      photo: Pick<StoryEditBlock, 'tripPlaceId' | 'tripAttachmentId' | 'thumbnailUrl'> & {
        placeName?: string;
      },
    ) =>
      change((current) =>
        insertStoryEditBlock(current, dayKey, index, {
          key: createNewBlockKey(),
          storyBlockId: null,
          tripPlaceId: photo.tripPlaceId,
          tripAttachmentId: photo.tripAttachmentId,
          thumbnailUrl: photo.thumbnailUrl,
          detailSummary: photo.placeName ?? '',
          memo: '',
        }),
      ),
    changeTone,
    submit,
  };
}
