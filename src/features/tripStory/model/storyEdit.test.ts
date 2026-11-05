import { describe, expect, it } from 'vitest';

import {
  getStoryEditError,
  insertStoryEditBlock,
  toStoryEditDraft,
  toStoryUpdateRequest,
} from './storyEdit';
import type { TripStoryResponse } from './types';

function block(storyBlockId: number, orderNumber: number) {
  return {
    storyBlockId,
    orderNumber,
    tripPlaceId: 1,
    tripAttachmentId: storyBlockId * 10,
    thumbnailUrl: null,
    detailSummary: ` 요약 ${storyBlockId} `,
    memo: storyBlockId === 2 ? null : `문장 ${storyBlockId}`,
  };
}

const story: TripStoryResponse = {
  storyId: 1,
  tripId: 7,
  userByMe: true,
  mood: 'CALM',
  storySummary: '서울의 가을',
  days: [
    { date: '2026-10-12', dayLabel: '첫째 날', blocks: [block(2, 2), block(1, 1)] },
    { date: '2026-10-13', dayLabel: '둘째 날', blocks: [block(3, 3)] },
  ],
};

describe('storyEdit', () => {
  it('날짜 제목을 각 사진에 넣고, 화면 순서대로 orderNumber를 다시 매긴다', () => {
    expect(toStoryUpdateRequest(toStoryEditDraft(story))).toEqual({
      tone: 'CALM',
      storySummary: '서울의 가을',
      blocks: [
        {
          storyBlockId: 1,
          tripAttachmentId: 10,
          dayLabel: '첫째 날',
          detailSummary: '요약 1',
          memo: '문장 1',
          orderNumber: 1,
        },
        {
          storyBlockId: 2,
          tripAttachmentId: 20,
          dayLabel: '첫째 날',
          detailSummary: '요약 2',
          memo: null,
          orderNumber: 2,
        },
        {
          storyBlockId: 3,
          tripAttachmentId: 30,
          dayLabel: '둘째 날',
          detailSummary: '요약 3',
          memo: '문장 3',
          orderNumber: 3,
        },
      ],
    });
  });

  it('백엔드 글자 수 제한을 이모지까지 한 글자로 세서 미리 확인한다', () => {
    const draft = toStoryEditDraft(story);
    expect(getStoryEditError(draft)).toBeNull();
    expect(getStoryEditError({ ...draft, storySummary: '😀'.repeat(20) })).toBeNull();
    expect(getStoryEditError({ ...draft, storySummary: '😀'.repeat(21) })).toMatch('20자');
    expect(getStoryEditError({ ...draft, storySummary: '   ' })).toMatch('요약');
    expect(getStoryEditError({ ...draft, days: [] })).toMatch('한 장 이상');
  });

  it('새로 넣은 사진은 storyBlockId 없이 그 자리 순서와 그날 제목으로 보낸다', () => {
    const draft = toStoryEditDraft(story);
    const next = insertStoryEditBlock(draft, draft.days[0].key, 1, {
      key: 'new-test',
      storyBlockId: null,
      tripPlaceId: 1,
      tripAttachmentId: 99,
      thumbnailUrl: null,
      detailSummary: '새 사진',
      memo: '',
    });

    expect(
      toStoryUpdateRequest(next).blocks.map(
        ({ storyBlockId, tripAttachmentId, dayLabel, orderNumber }) => [
          storyBlockId,
          tripAttachmentId,
          dayLabel,
          orderNumber,
        ],
      ),
    ).toEqual([
      [1, 10, '첫째 날', 1],
      [null, 99, '첫째 날', 2],
      [2, 20, '첫째 날', 3],
      [3, 30, '둘째 날', 4],
    ]);
  });
});
