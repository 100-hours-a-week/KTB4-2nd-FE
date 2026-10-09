import type { PhotoAccent } from '@/features/photoList';

/** 백엔드 `AttachmentIssue`에서 NONE을 뺀 미분류 사유입니다. */
export type UnclassifiedIssue = 'UNCLEAR_LOCATION' | 'BLURRY' | 'DUPLICATED';

export type UnclassifiedFolder = {
  issue: UnclassifiedIssue;
  photoCount: number;
  thumbnailUrl: string | null;
  accent: PhotoAccent;
};

export type UnclassifiedViewState = 'ready' | 'loading' | 'error';

/** 백엔드 응답 순서와 같은 사유 순서입니다. */
export const UNCLASSIFIED_ISSUES: readonly UnclassifiedIssue[] = [
  'UNCLEAR_LOCATION',
  'BLURRY',
  'DUPLICATED',
];

export const UNCLASSIFIED_ISSUE_LABEL: Record<UnclassifiedIssue, string> = {
  UNCLEAR_LOCATION: '장소가 애매한 사진',
  BLURRY: '흐릿한 사진',
  DUPLICATED: '중복 사진',
};

const ISSUE_SLUG: Record<UnclassifiedIssue, string> = {
  UNCLEAR_LOCATION: 'unclear-location',
  BLURRY: 'blurry',
  DUPLICATED: 'duplicated',
};

export function toUnclassifiedIssueSlug(issue: UnclassifiedIssue) {
  return ISSUE_SLUG[issue];
}

export function parseUnclassifiedIssueSlug(slug: string): UnclassifiedIssue | null {
  return UNCLASSIFIED_ISSUES.find((issue) => ISSUE_SLUG[issue] === slug) ?? null;
}
