'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { forgetMapViewport, MainMap } from '@/features/mainMap/ui/mainMap';
import { mainMapQueries } from '@/queryFactory';
import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottomNavigation';
import { toast } from '@/shared/ui/toast';

const navigationItems: BottomNavigationItem[] = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'list', label: '목록', icon: 'list', href: '/trips' },
  {
    id: 'create',
    label: '새 기록 추가',
    icon: 'plus',
    href: '/trips/create?step=name',
    action: true,
  },
  { id: 'search', label: '검색', icon: 'search', disabled: true },
  { id: 'profile', label: '마이페이지', icon: 'profile', href: '/mypage' },
];

export function HomePage() {
  const router = useRouter();
  const [resetSignal, setResetSignal] = useState(0);
  const { data: trips = [], isError } = useQuery(mainMapQueries.markers());

  useEffect(() => {
    if (isError) toast.error('여행을 가져오지 못했어요.');
  }, [isError]);

  return (
    <main className="relative mx-auto h-dvh w-full max-w-[430px] overflow-hidden bg-app-background">
      <h1 className="sr-only">여담</h1>
      <MainMap
        trips={trips}
        resetSignal={resetSignal}
        onTripSelect={(tripId) => router.push(`/trips/${tripId}`)}
      />
      <BottomNavigation
        items={navigationItems}
        activeId="home"
        onSelect={(id) => {
          if (id !== 'home') return;
          forgetMapViewport();
          setResetSignal((signal) => signal + 1);
        }}
      />
    </main>
  );
}
