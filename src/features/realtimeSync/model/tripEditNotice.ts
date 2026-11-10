import { isRecord } from './syncAiTaskMessage';

const CHANGE_LABELS: [key: string, label: string, particle: string][] = [
  ['tripName', '이름', '이'],
  ['startDate', '날짜', '가'],
  ['regionCodes', '장소', '가'],
];

const OWN_REQUEST_LIMIT = 50;
const ownRequestIds = new Set<string>();

/** 내가 보낸 편집 명령을 기억해 두고, 그 명령으로 생긴 알림은 띄우지 않습니다. */
export function rememberOwnTripEditRequest(requestId: string) {
  ownRequestIds.add(requestId);
  if (ownRequestIds.size > OWN_REQUEST_LIMIT) {
    ownRequestIds.delete(ownRequestIds.values().next().value!);
  }
}

export function isOwnTripEditRequest(requestId: unknown) {
  return typeof requestId === 'string' && ownRequestIds.has(requestId);
}

/** 이벤트에 누가 바꿨는지는 없어서, 무엇이 바뀌었는지만 알려줍니다. */
export function getTripEditNotice(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.data)) return null;
  const { message, data } = body;

  if (message === 'TRIP_UPDATED') {
    const changes = isRecord(data.changes) ? data.changes : {};
    const changed = CHANGE_LABELS.filter(([key]) => key in changes);
    if (changed.length === 0) return '여행 정보가 바뀌었어요.';
    const particle = changed[changed.length - 1][2];
    return `여행 ${changed.map(([, label]) => label).join('·')}${particle} 바뀌었어요.`;
  }
  if (message === 'TRIP_PHOTOS_DELETED') {
    const count = typeof data.attachmentCount === 'number' ? data.attachmentCount : null;
    return count ? `사진 ${count}장이 지워졌어요.` : '사진이 지워졌어요.';
  }
  return null;
}
