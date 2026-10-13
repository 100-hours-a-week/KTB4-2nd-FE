'use client';

import { useEffect, useRef, useState } from 'react';

import { useLogout, useWithdraw } from '@/features/manageAccount';
import { Avatar } from '@/shared/ui/avatar';
import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottomNavigation';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { DocumentIcon, KakaoIcon, ShieldIcon } from '@/shared/ui/icons';
import { ListRow } from '@/shared/ui/listRow';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';

export type MyPageUser = {
  nickname: string;
  oauthConnected: boolean;
  profileImageUrl?: string | null;
};

export type MyPageProps = {
  user: MyPageUser | null;
};

const APP_VERSION = 'v1.0.0';

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

      <section aria-label="계정 정보" className="mt-7 flex flex-col gap-2.5">
        {user ? <ProfileCard user={user} /> : <ProfileCardSkeleton />}

        <ListRow
          href="/terms/service"
          icon={<DocumentIcon strokeLinecap="round" strokeLinejoin="round" size="20" />}
          label="이용약관"
        />

        <ListRow
          href="/terms/privacy"
          icon={<ShieldIcon strokeLinecap="round" strokeLinejoin="round" size="20" />}
          label="개인정보처리방침"
        />

        <Button
          variant="secondary"
          onClick={() => requestLogout()}
          isLoading={isLoggingOut}
          className="rounded-row mt-1 w-full text-[15px]"
        >
          로그아웃
        </Button>
      </section>

      <div className="mt-8 flex flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={() => setWithdrawOpen(true)}
          className="text-muted hover:text-brand focus-visible:outline-brand cursor-pointer text-[13px] font-medium underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          탈퇴하기
        </button>
        <p className="text-muted/70 text-[11px] font-medium">여담 · {APP_VERSION}</p>
      </div>

      <Dialog
        destructive
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="정말 탈퇴하시겠어요?"
        description={
          <>
            탈퇴하면 모든 여행과 사진이 삭제되며
            <br />
            다시 복구할 수 없어요.
          </>
        }
      >
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => setWithdrawOpen(false)}
            disabled={isWithdrawing}
            className="min-h-11 w-full px-0 text-sm"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={() => requestWithdraw(undefined, { onError: () => setWithdrawOpen(false) })}
            isLoading={isWithdrawing}
            className="min-h-11 w-full px-0 text-sm"
          >
            탈퇴하기
          </Button>
        </DialogActions>
      </Dialog>

      <BottomNavigation items={navigationItems} activeId="profile" />
    </main>
  );
}

function ProfileCard({ user }: { user: MyPageUser }) {
  return (
    <Card className="flex items-center gap-3.5 px-4 py-4">
      <Avatar src={user.profileImageUrl} alt={`${user.nickname} 프로필 사진`} />
      <div className="min-w-0">
        <p className="truncate text-[15px] leading-6 font-bold tracking-[-0.01em]">
          {user.nickname}
        </p>
        <p className="text-muted mt-1 flex items-center gap-1.5 text-xs font-medium">
          <KakaoAccountBadge />
          {user.oauthConnected ? '카카오 계정으로 연결됨' : '카카오 계정 연결 필요'}
        </p>
      </div>
    </Card>
  );
}

function ProfileCardSkeleton() {
  return (
    <Card
      className="flex items-center gap-3.5 px-4 py-4"
      role="status"
      aria-label="프로필 불러오는 중"
    >
      <Skeleton circle className="size-12" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-40" />
      </div>
    </Card>
  );
}

function KakaoAccountBadge() {
  return (
    <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[#FEE500] text-[#191919]">
      <KakaoIcon fill="currentColor" size="10" variant="badge" />
    </span>
  );
}
