import { describe, expect, it } from 'vitest';

import { getTripPresenceLabel } from '../ui/tripPresenceBar';
import { isNewerSnapshot, parseTripPresenceSnapshot } from './tripPresence';

const member = (userId: number, nickname: string) => ({
  userId,
  nickname,
  profileImageUrl: null,
  permission: 'WRITE' as const,
});

function body(data: Record<string, unknown>) {
  return { message: 'PRESENCE_SNAPSHOT', data: { tripId: 7, epoch: 'a', revision: 1, ...data } };
}

describe('parseTripPresenceSnapshot', () => {
  it('같은 여행의 스냅숏만 받고, 형식이 맞지 않는 참여자가 있으면 통째로 버린다', () => {
    expect(parseTripPresenceSnapshot(body({ members: [member(1, '혜준')] }), 7)?.members).toEqual([
      member(1, '혜준'),
    ]);
    expect(parseTripPresenceSnapshot(body({ members: [] }), 8)).toBeNull();
    expect(
      parseTripPresenceSnapshot(
        body({ members: [{ ...member(1, '혜준'), permission: 'ADMIN' }] }),
        7,
      ),
    ).toBeNull();
    expect(parseTripPresenceSnapshot({ message: 'TRIP_UPDATED', data: {} }, 7)).toBeNull();
  });
});

describe('isNewerSnapshot', () => {
  const snapshot = (epoch: string, revision: number) => ({
    tripId: 7,
    epoch,
    revision,
    members: [],
  });

  it('같은 epoch에서는 revision이 커야 새것이고, epoch가 바뀌면 새것으로 본다', () => {
    expect(isNewerSnapshot(null, snapshot('a', 0))).toBe(true);
    expect(isNewerSnapshot(snapshot('a', 3), snapshot('a', 2))).toBe(false);
    expect(isNewerSnapshot(snapshot('a', 3), snapshot('a', 4))).toBe(true);
    expect(isNewerSnapshot(snapshot('a', 3), snapshot('b', 0))).toBe(true);
  });
});

describe('getTripPresenceLabel', () => {
  it('두 명까지는 이름을 모두 쓰고, 세 명부터는 줄인다', () => {
    expect(getTripPresenceLabel([member(2, '지민')])).toBe('지민님과 함께 보는 중');
    expect(getTripPresenceLabel([member(2, '지민'), member(3, '서연')])).toBe(
      '지민, 서연님과 함께 보는 중',
    );
    expect(getTripPresenceLabel([member(2, '지민'), member(3, '서연'), member(4, '도현')])).toBe(
      '지민 외 2명과 함께 보는 중',
    );
  });
});
