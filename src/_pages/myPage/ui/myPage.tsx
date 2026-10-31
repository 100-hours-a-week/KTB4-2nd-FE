'use client';

import { useEffect, useRef, useState } from 'react';

import { useLogout, useWithdraw } from '@/features/manageAccount';
import { useUserStats } from '@/features/userStats';
import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottomNavigation';
import { Button } from '@/shared/ui/button';
import { DocumentIcon, ShieldIcon, StarIcon } from '@/shared/ui/icons';
import { toast } from '@/shared/ui/toast';

import { MenuGroup, MenuRow } from './components/menuGroup';
import { ProfileCard, ProfileCardSkeleton, type MyPageUser } from './components/profileCard';
import { StatsSummary } from './components/statsSummary';
import { StorageCard } from './components/storageCard';
import { WithdrawDialog } from './components/withdrawDialog';

export type { MyPageUser };

export type MyPageProps = {
  user: MyPageUser | null;
};

const APP_VERSION = 'v2.0.0';

const navigationItems: BottomNavigationItem[] = [
  { id: 'home', label: '홈', icon: 'home', href: '/' },
  { id: 'list', label: '목록', icon: 'list', href: '/trips' },
  {
    id: 'create',
    label: '새 기록 추가',
    icon: 'plus',
    href: '/trips/create?step=name',
    action: true,
  },
  { id: 'search', label: '검색', icon: 'search', href: '/search' },
  { id: 'profile', label: '마이페이지', icon: 'profile', href: '/mypage' },
];

export function MyPage({ user }: MyPageProps) {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const failureNotifiedRef = useRef(false);
  const { mutate: requestLogout, isPending: isLoggingOut } = useLogout();
  const { mutate: requestWithdraw, isPending: isWithdrawing } = useWithdraw();
  const { stats, favoriteTripCount } = useUserStats();

  useEffect(() => {
    if (user) {
      failureNotifiedRef.current = false;
      return;
    }

    if (failureNotifiedRef.current) return;
    failureNotifiedRef.current = true;
    toast.error('잠시 후 다시 시도해주세요.');
  }, [user]);

  return (
    <main className="page-enter text-brand bg-surface relative mx-auto flex h-full w-full max-w-107.5 flex-col overflow-y-auto px-5 pt-[max(32px,env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))]">
      <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.03em]">마이페이지</h1>

      <div className="mt-7 flex flex-col gap-2.5">
        {user ? <ProfileCard user={user} /> : <ProfileCardSkeleton />}
        <StatsSummary stats={stats} />
        <StorageCard stats={stats} />
      </div>

      <div className="mt-7 flex flex-col gap-6">
        <MenuGroup title="내 여행">
          <MenuRow
            href="/mypage/favorites"
            icon={
              <StarIcon strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" size="20" />
            }
            label="즐겨찾기한 여행"
            value={favoriteTripCount === null ? undefined : `${favoriteTripCount}개`}
          />
        </MenuGroup>

        <MenuGroup title="정보">
          <MenuRow
            href="/terms/service"
            icon={<DocumentIcon strokeLinecap="round" strokeLinejoin="round" size="20" />}
            label="이용약관"
          />
          <MenuRow
            href="/terms/privacy"
            icon={<ShieldIcon strokeLinecap="round" strokeLinejoin="round" size="20" />}
            label="개인정보처리방침"
          />
        </MenuGroup>

        <Button
          variant="secondary"
          onClick={() => requestLogout()}
          isLoading={isLoggingOut}
          className="w-full"
        >
          로그아웃
        </Button>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2.5">
        <Button variant="ghost" size="sm" onClick={() => setWithdrawOpen(true)}>
          탈퇴하기
        </Button>
        <p className="text-muted/70 text-[11px] font-medium">여담 · {APP_VERSION}</p>
      </div>

      <WithdrawDialog
        open={withdrawOpen}
        isWithdrawing={isWithdrawing}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={() => requestWithdraw(undefined, { onError: () => setWithdrawOpen(false) })}
      />

      <BottomNavigation items={navigationItems} activeId="profile" />
    </main>
  );
}
