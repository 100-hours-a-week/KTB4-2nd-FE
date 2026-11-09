'use client';

import { useState } from 'react';

import { Avatar } from '@/shared/ui/avatar';
import { BottomSheet } from '@/shared/ui/bottomSheet';
import { Button } from '@/shared/ui/button';
import { ChevronRightIcon } from '@/shared/ui/icons';

import type { TripPresenceMember, TripPresencePermission } from '../model/tripPresence';

const PARTICIPANT_COLORS = [
  'bg-participant-1',
  'bg-participant-2',
  'bg-participant-3',
  'bg-participant-4',
];

const PERMISSION_LABELS: Record<TripPresencePermission, string> = {
  OWNER: '여행 주인',
  WRITE: '편집할 수 있어요',
  READ: '보기만 할 수 있어요',
};

const MAX_STACKED_AVATARS = 3;

/** 같은 사람은 바, 시트 어디서든 같은 색으로 보이도록 userId로 색을 고릅니다. */
function participantColor(userId: number) {
  return PARTICIPANT_COLORS[userId % PARTICIPANT_COLORS.length];
}

export function getTripPresenceLabel(others: TripPresenceMember[]) {
  const [first, second] = others.map((member) => member.nickname);
  if (others.length === 1) return `${first}님과 함께 편집 중`;
  if (others.length === 2) return `${first}, ${second}님과 함께 편집 중`;
  return `${first} 외 ${others.length - 1}명과 함께 편집 중`;
}

function ParticipantAvatar({
  member,
  size,
  className = '',
}: {
  member: TripPresenceMember;
  size: 'xs' | 'sm';
  className?: string;
}) {
  return (
    <Avatar
      src={member.profileImageUrl}
      alt=""
      size={size}
      className={className}
      fallback={
        <span
          aria-hidden="true"
          className={`absolute inset-0 grid place-items-center font-bold text-white ${size === 'xs' ? 'text-[10px]' : 'text-caption'} ${participantColor(member.userId)}`}
        >
          {[...member.nickname.trim()][0]}
        </span>
      }
    />
  );
}

/** 나 말고 다른 사람이 같은 여행을 편집 중일 때만 헤더 아래에 보입니다. */
export function TripPresenceBar({
  members,
  currentUserId,
}: {
  members: TripPresenceMember[];
  currentUserId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const others = members.filter((member) => member.userId !== currentUserId);
  if (others.length === 0) return null;

  const me = members.find((member) => member.userId === currentUserId);
  const sheetMembers = me ? [me, ...others] : others;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="bg-surface-subtle hover:bg-surface-subtle-hover focus-visible:outline-brand rounded-pill mt-2 flex min-h-11 w-full shrink-0 items-center gap-2 py-1.5 pr-3 pl-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-colors"
      >
        <span aria-hidden="true" className="flex shrink-0">
          {others.slice(0, MAX_STACKED_AVATARS).map((member, index) => (
            <ParticipantAvatar
              key={member.userId}
              member={member}
              size="xs"
              className={`ring-surface-subtle border-0 ring-2 ${index > 0 ? '-ml-1.5' : ''}`}
            />
          ))}
        </span>
        <span className="text-label min-w-0 flex-1 truncate">{getTripPresenceLabel(others)}</span>
        <span aria-hidden="true" className="bg-success size-1.5 shrink-0 rounded-full" />
        <ChevronRightIcon aria-hidden="true" size="16" className="text-muted shrink-0" />
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={`함께 편집 중 ${sheetMembers.length}명`}
        description="지금 이 여행을 열어 둔 사람이에요."
      >
        <ul className="divide-border-subtle divide-y">
          {sheetMembers.map((member) => (
            <li key={member.userId} className="flex items-center gap-3 py-3">
              <ParticipantAvatar member={member} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-label truncate">
                  {member.nickname}
                  {member === me && <span className="text-muted font-normal"> (나)</span>}
                </p>
                <p className="text-caption text-muted">{PERMISSION_LABELS[member.permission]}</p>
              </div>
            </li>
          ))}
        </ul>
        <Button variant="secondary" onClick={() => setOpen(false)} className="mt-4 w-full">
          닫기
        </Button>
      </BottomSheet>
    </>
  );
}
