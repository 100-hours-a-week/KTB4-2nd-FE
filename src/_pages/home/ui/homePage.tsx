'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { TripMapMarker } from '@/features/mainMap/model/tripMapMarker';
import { forgetMapViewport, MainMap } from '@/features/mainMap/ui/mainMap';
import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottomNavigation';

const navigationItems: BottomNavigationItem[] = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'list', label: '목록', icon: 'list', disabled: true },
  {
    id: 'create',
    label: '새 기록 추가',
    icon: 'plus',
    href: '/trips/create?step=name',
    action: true,
  },
  { id: 'search', label: '검색', icon: 'search', disabled: true },
  { id: 'profile', label: '마이페이지', icon: 'profile', disabled: true },
];

export function HomePage({ trips = [] }: { trips?: TripMapMarker[] }) {
  const router = useRouter();
  const [resetSignal, setResetSignal] = useState(0);

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
