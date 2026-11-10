'use client';

import { createContext, type ReactNode, useContext } from 'react';

import type { TripPresenceMember } from '../model/tripPresence';
import { useTripPresence } from '../model/useTripPresence';
import { TripPresenceBar } from './tripPresenceBar';

type TripPresenceContextValue = {
  members: TripPresenceMember[];
  currentUserId: number | null;
};

const TripPresenceContext = createContext<TripPresenceContextValue | null>(null);

/**
 * 여행 레이아웃에 한 번만 두어, 여행 안의 화면을 옮겨 다녀도 접속을 이어 갑니다.
 * currentUserId는 접속자 목록에서 나를 빼는 데 씁니다. 확인하지 못했으면 null입니다.
 */
export function TripPresenceProvider({
  tripId,
  currentUserId,
  children,
}: {
  tripId: number;
  currentUserId: number | null;
  children: ReactNode;
}) {
  const members = useTripPresence(tripId);

  return (
    <TripPresenceContext.Provider value={{ members, currentUserId }}>
      {children}
    </TripPresenceContext.Provider>
  );
}

/** 각 화면의 헤더 바로 아래에 둡니다. 나 말고 다른 사람이 같은 여행을 열어 두었을 때만 보입니다. */
export function TripPresenceStatus({ className }: { className?: string }) {
  const presence = useContext(TripPresenceContext);
  if (!presence) return null;

  return (
    <TripPresenceBar
      members={presence.members}
      currentUserId={presence.currentUserId}
      className={className}
    />
  );
}
