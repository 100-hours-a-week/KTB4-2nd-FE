import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RealtimeSubscription } from '@/shared/api/realtime';

import { TripPresenceProvider, TripPresenceStatus } from './tripPresenceProvider';

const { realtime } = vi.hoisted(() => ({
  realtime: { subscriptions: [] as RealtimeSubscription[], publish: vi.fn() },
}));

vi.mock('@/shared/api/realtime', () => ({
  isRealtimeConnected: () => true,
  subscribeRealtimeStatus: () => () => {},
  publishRealtime: (destination: string) => {
    realtime.publish(destination);
    return true;
  },
  subscribeRealtime: (subscription: RealtimeSubscription) => {
    realtime.subscriptions.push(subscription);
    subscription.onSubscribed?.();
    return () => {
      realtime.subscriptions = realtime.subscriptions.filter((item) => item !== subscription);
    };
  },
}));

function snapshot(members: { userId: number; nickname: string; permission: string }[]) {
  act(() =>
    realtime.subscriptions.forEach((subscription) =>
      subscription.onMessage({
        message: 'PRESENCE_SNAPSHOT',
        data: {
          tripId: 7,
          epoch: 'epoch-1',
          revision: members.length,
          members: members.map((member) => ({ ...member, profileImageUrl: null })),
        },
      }),
    ),
  );
}

function Page({ title }: { title: string }) {
  return (
    <main>
      <h1>{title}</h1>
      <TripPresenceStatus />
    </main>
  );
}

describe('TripPresenceProvider', () => {
  beforeEach(() => {
    realtime.subscriptions = [];
    vi.clearAllMocks();
  });

  it('화면을 옮겨도 한 번만 접속하고, 다른 사람이 있으면 헤더 아래 바와 참여자 시트를 보여준다', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TripPresenceProvider tripId={7} currentUserId={1}>
        <Page title="여행 상세" />
      </TripPresenceProvider>,
    );
    expect(realtime.publish).toHaveBeenCalledWith('/app/trips/7/presence/join');

    snapshot([{ userId: 1, nickname: '혜준', permission: 'OWNER' }]);
    expect(screen.queryByText(/함께 보는 중/)).not.toBeInTheDocument();

    snapshot([
      { userId: 1, nickname: '혜준', permission: 'OWNER' },
      { userId: 2, nickname: '지민', permission: 'WRITE' },
    ]);
    rerender(
      <TripPresenceProvider tripId={7} currentUserId={1}>
        <Page title="사진 목록" />
      </TripPresenceProvider>,
    );

    expect(realtime.publish).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: '지민님과 함께 보는 중' }));
    const sheet = screen.getByRole('dialog', { name: '함께 보는 중 2명' });
    expect(sheet).toHaveTextContent('혜준 (나)');
    expect(sheet).toHaveTextContent('편집할 수 있어요');
  });

  it('여행 레이아웃 밖에서는 아무것도 그리지 않는다', () => {
    const { container } = render(<TripPresenceStatus />);

    expect(container).toBeEmptyDOMElement();
  });
});
