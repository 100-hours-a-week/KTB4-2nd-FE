'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect } from 'react';

import { tripListQueries, tripShareQueries } from '@/queryFactory';

export type TripAccess = {
  /** 권한을 확인하는 중이면 true이며, 이때는 모든 변경을 막습니다. */
  isChecking: boolean;
  /** 공유, 여행 삭제, 스토리 만들기는 여행 주인만 할 수 있습니다. */
  isOwner: boolean;
  /** 여행 수정과 사진 추가·삭제·해제입니다. 주인과 편집 권한으로 공유받은 사람이 할 수 있습니다. */
  canEdit: boolean;
};

const CHECKING: TripAccess = { isChecking: true, isOwner: false, canEdit: false };
// 권한을 확인하지 못한 오류에서는 주인까지 막지 않도록 열어두고, 실제 거절은 백엔드에 맡깁니다.
const UNVERIFIED: TripAccess = { isChecking: false, isOwner: true, canEdit: true };

function isNotFound(error: unknown) {
  return isAxiosError(error) && error.response?.status === 404;
}

/**
 * 여행 상세 응답에는 권한이 없어서 두 API로 판단합니다.
 * 공유 대상자 목록은 주인만 조회할 수 있고(주인이 아니면 404), 초대받은 여행 목록에는 내 권한이 들어 있습니다.
 * TODO: 여행 상세 응답에 권한이 생기면 그 값으로 바꿉니다.
 */
export function useTripAccess(tripId: number): TripAccess {
  const shares = useInfiniteQuery(tripShareQueries.list(tripId));
  const notOwner = isNotFound(shares.error);
  const invited = useInfiniteQuery({ ...tripListQueries.invited(), enabled: notOwner });
  const invitedTrip = invited.data?.pages
    .flatMap((page) => page.trips)
    .find((trip) => trip.id === tripId);
  const { hasNextPage, isFetchingNextPage, isError: invitedFailed, fetchNextPage } = invited;

  useEffect(() => {
    if (!notOwner || invitedTrip || !hasNextPage || isFetchingNextPage || invitedFailed) return;

    void fetchNextPage();
  }, [notOwner, invitedTrip, hasNextPage, isFetchingNextPage, invitedFailed, fetchNextPage]);

  if (shares.isSuccess) return { isChecking: false, isOwner: true, canEdit: true };
  if (shares.isPending) return CHECKING;
  if (!notOwner) return UNVERIFIED;

  if (invitedTrip) {
    return { isChecking: false, isOwner: false, canEdit: invitedTrip.permission === 'WRITE' };
  }
  if (invitedFailed) return { isChecking: false, isOwner: false, canEdit: true };
  if (invited.isPending || hasNextPage) return CHECKING;
  // 목록 끝까지 없으면 공유가 끝난 것이므로 읽기만 허용합니다.
  return { isChecking: false, isOwner: false, canEdit: false };
}
