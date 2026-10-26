import { Avatar } from '@/shared/ui/avatar';
import { Card } from '@/shared/ui/card';
import { KakaoIcon } from '@/shared/ui/icons';
import { Skeleton } from '@/shared/ui/skeleton';

export type MyPageUser = {
  nickname: string;
  oauthConnected: boolean;
  profileImageUrl?: string | null;
};

export function ProfileCard({ user }: { user: MyPageUser }) {
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

export function ProfileCardSkeleton() {
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
