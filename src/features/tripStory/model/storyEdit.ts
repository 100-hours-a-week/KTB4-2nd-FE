import type { TripStoryMood, TripStoryResponse } from './types';

export const STORY_SUMMARY_LIMIT = 20;
export const STORY_DAY_LABEL_LIMIT = 40;
export const STORY_DETAIL_SUMMARY_LIMIT = 40;
export const STORY_MEMO_LIMIT = 125;
/** 백엔드가 받는 스토리 사진 수의 최대값입니다. */
export const STORY_BLOCK_LIMIT = 30;

/** 글 분위기 다시 쓰기(tone-preview)는 이 세 가지만 지원합니다. */
export const STORY_TONE_PREVIEW_MOODS = ['PLAIN', 'HUMOROUS', 'LITERARY'] as const;

export type StoryEditBlock = {
  /** 화면에서 사진을 구분하는 값입니다. 새로 넣은 사진은 storyBlockId가 없어 따로 둡니다. */
  key: string;
  /** 새로 넣은 사진은 null이며, 저장하면 백엔드가 번호를 만듭니다. */
  storyBlockId: number | null;
  tripPlaceId: number;
  tripAttachmentId: number;
  thumbnailUrl: string | null;
  detailSummary: string;
  memo: string;
};

export type StoryEditDay = {
  key: string;
  date: string;
  dayLabel: string;
  blocks: StoryEditBlock[];
};

export type StoryEditDraft = {
  storyId: number;
  mood: TripStoryMood;
  storySummary: string;
  days: StoryEditDay[];
};

type StoryContentDay = Omit<TripStoryResponse['days'][number], 'blocks'> & {
  blocks: (Omit<TripStoryResponse['days'][number]['blocks'][number], 'storyBlockId'> & {
    /** 미리보기에서는 아직 저장하지 않은 사진이 null로 옵니다. */
    storyBlockId: number | null;
  })[];
};

type StoryContent = Pick<TripStoryResponse, 'storyId' | 'mood' | 'storySummary'> & {
  days: StoryContentDay[];
};

/** 수정 응답은 저장된 사진만 담아서 storyBlockId가 항상 있습니다. */
export type StoryUpdateResponse = Pick<TripStoryResponse, 'storyId' | 'storySummary' | 'days'> & {
  tone: TripStoryMood;
};

export type StoryTonePreviewResponse = Omit<StoryContent, 'mood'> & { tone: TripStoryMood };

export type StoryUpdateRequest = {
  tone: TripStoryMood;
  storySummary: string;
  blocks: {
    storyBlockId: number | null;
    tripAttachmentId: number;
    dayLabel: string;
    detailSummary: string;
    memo: string | null;
    orderNumber: number;
  }[];
};

export type StoryTonePreviewRequest = {
  tone: TripStoryMood;
  blocks: {
    storyBlockId: number | null;
    tripAttachmentId: number;
    orderNumber: number;
    dayLabel: string | null;
    detailSummary: string | null;
    memo: string | null;
  }[];
};

let newBlockSequence = 0;

/** 아직 저장하지 않은 사진에 붙일 화면용 key를 만듭니다. */
export function createNewBlockKey() {
  newBlockSequence += 1;
  return `new-${newBlockSequence}`;
}

export function toStoryEditDraft(story: StoryContent): StoryEditDraft {
  return {
    storyId: story.storyId,
    mood: story.mood,
    storySummary: story.storySummary,
    days: story.days.map((day, index) => ({
      key: `${day.date}-${index}`,
      date: day.date,
      dayLabel: day.dayLabel,
      blocks: [...day.blocks]
        .sort((a, b) => a.orderNumber - b.orderNumber)
        .map((block) => ({
          key: block.storyBlockId === null ? createNewBlockKey() : `block-${block.storyBlockId}`,
          storyBlockId: block.storyBlockId,
          tripPlaceId: block.tripPlaceId,
          tripAttachmentId: block.tripAttachmentId,
          thumbnailUrl: block.thumbnailUrl,
          detailSummary: block.detailSummary,
          memo: block.memo ?? '',
        })),
    })),
  };
}

/** 수정·미리보기 응답(`tone`)을 조회 응답(`mood`) 모양으로 맞춥니다. */
export function fromStoryContentResponse<T extends { tone: TripStoryMood }>({
  tone,
  ...story
}: T): Omit<T, 'tone'> & { mood: TripStoryMood } {
  return { ...story, mood: tone };
}

function flattenBlocks(draft: StoryEditDraft) {
  return draft.days.flatMap((day) => day.blocks.map((block) => ({ day, block })));
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function toStoryUpdateRequest(draft: StoryEditDraft): StoryUpdateRequest {
  return {
    tone: draft.mood,
    storySummary: draft.storySummary.trim(),
    blocks: flattenBlocks(draft).map(({ day, block }, index) => ({
      storyBlockId: block.storyBlockId,
      tripAttachmentId: block.tripAttachmentId,
      dayLabel: day.dayLabel.trim(),
      detailSummary: block.detailSummary.trim(),
      memo: optionalText(block.memo),
      orderNumber: index + 1,
    })),
  };
}

export function toStoryTonePreviewRequest(
  draft: StoryEditDraft,
  tone: TripStoryMood,
): StoryTonePreviewRequest {
  return {
    tone,
    blocks: flattenBlocks(draft).map(({ day, block }, index) => ({
      storyBlockId: block.storyBlockId,
      tripAttachmentId: block.tripAttachmentId,
      orderNumber: index + 1,
      dayLabel: optionalText(day.dayLabel),
      detailSummary: optionalText(block.detailSummary),
      memo: optionalText(block.memo),
    })),
  };
}

export function updateStoryEditBlock(
  draft: StoryEditDraft,
  blockKey: string,
  patch: Partial<Omit<StoryEditBlock, 'key' | 'storyBlockId' | 'tripPlaceId'>>,
): StoryEditDraft {
  return {
    ...draft,
    days: draft.days.map((day) => ({
      ...day,
      blocks: day.blocks.map((block) => (block.key === blockKey ? { ...block, ...patch } : block)),
    })),
  };
}

export function removeStoryEditBlock(draft: StoryEditDraft, blockKey: string): StoryEditDraft {
  return {
    ...draft,
    days: draft.days
      .map((day) => ({ ...day, blocks: day.blocks.filter((block) => block.key !== blockKey) }))
      .filter((day) => day.blocks.length > 0),
  };
}

/** 그날의 index 자리에 사진을 끼워 넣습니다. */
export function insertStoryEditBlock(
  draft: StoryEditDraft,
  dayKey: string,
  index: number,
  block: StoryEditBlock,
): StoryEditDraft {
  return {
    ...draft,
    days: draft.days.map((day) =>
      day.key === dayKey
        ? { ...day, blocks: [...day.blocks.slice(0, index), block, ...day.blocks.slice(index)] }
        : day,
    ),
  };
}

/** 백엔드와 같이 이모지도 한 글자로 셉니다. */
export function countStoryText(value: string) {
  return [...value].length;
}

function isRequiredTextValid(value: string, limit: number) {
  const trimmed = value.trim();
  return trimmed.length > 0 && countStoryText(trimmed) <= limit;
}

export function getStoryEditError(draft: StoryEditDraft): string | null {
  if (!isRequiredTextValid(draft.storySummary, STORY_SUMMARY_LIMIT))
    return `스토리 한 줄 요약을 ${STORY_SUMMARY_LIMIT}자 이내로 입력해주세요.`;
  if (draft.days.length === 0) return '사진을 한 장 이상 남겨주세요.';
  if (draft.days.flatMap((day) => day.blocks).length > STORY_BLOCK_LIMIT)
    return `사진은 ${STORY_BLOCK_LIMIT}장까지 넣을 수 있어요.`;
  if (draft.days.some((day) => !isRequiredTextValid(day.dayLabel, STORY_DAY_LABEL_LIMIT)))
    return `날짜 제목을 ${STORY_DAY_LABEL_LIMIT}자 이내로 입력해주세요.`;

  const blocks = draft.days.flatMap((day) => day.blocks);
  if (blocks.some((block) => !isRequiredTextValid(block.detailSummary, STORY_DETAIL_SUMMARY_LIMIT)))
    return `사진 제목을 1~${STORY_DETAIL_SUMMARY_LIMIT}자로 입력해주세요.`;
  if (blocks.some((block) => countStoryText(block.memo.trim()) > STORY_MEMO_LIMIT))
    return `사진 설명은 ${STORY_MEMO_LIMIT}자 이내로 입력해주세요.`;
  return null;
}
