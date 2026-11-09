export type TripPresencePermission = 'OWNER' | 'WRITE' | 'READ';

export type TripPresenceMember = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  permission: TripPresencePermission;
};

export type TripPresenceSnapshot = {
  tripId: number;
  epoch: string;
  revision: number;
  members: TripPresenceMember[];
};

const PERMISSIONS = new Set<string>(['OWNER', 'WRITE', 'READ']);

export function tripPresenceDestination(tripId: number) {
  return `/topic/trips/${tripId}/presence`;
}

export function tripPresenceCommand(tripId: number, command: 'join' | 'heartbeat' | 'leave') {
  return `/app/trips/${tripId}/presence/${command}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toMember(value: unknown): TripPresenceMember | null {
  if (!isRecord(value)) return null;
  const { userId, nickname, profileImageUrl, permission } = value;
  if (typeof userId !== 'number' || typeof nickname !== 'string' || !nickname.trim()) return null;
  if (typeof permission !== 'string' || !PERMISSIONS.has(permission)) return null;
  return {
    userId,
    nickname,
    profileImageUrl: typeof profileImageUrl === 'string' ? profileImageUrl : null,
    permission: permission as TripPresencePermission,
  };
}

export function parseTripPresenceSnapshot(
  body: unknown,
  tripId: number,
): TripPresenceSnapshot | null {
  if (!isRecord(body) || body.message !== 'PRESENCE_SNAPSHOT' || !isRecord(body.data)) return null;
  const { data } = body;
  if (data.tripId !== tripId || typeof data.epoch !== 'string') return null;
  if (typeof data.revision !== 'number' || !Array.isArray(data.members)) return null;

  const members = data.members.map(toMember);
  if (members.some((member) => member === null)) return null;
  return {
    tripId,
    epoch: data.epoch,
    revision: data.revision,
    members: members as TripPresenceMember[],
  };
}

/** 같은 epoch 안에서는 revision이 더 큰 스냅숏만 받습니다. epoch가 바뀌면 서버가 상태를 새로 쌓은 것입니다. */
export function isNewerSnapshot(current: TripPresenceSnapshot | null, next: TripPresenceSnapshot) {
  return !current || current.epoch !== next.epoch || next.revision > current.revision;
}
