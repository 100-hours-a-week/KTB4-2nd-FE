import { beforeEach, describe, expect, it, vi } from 'vitest';

import { syncLocalDataOwner } from './localDataOwner';

vi.mock('@/shared/lib/analytics', () => ({ clearIdentity: vi.fn() }));

const DRAFT_KEY = 'trip-create-draft-v1';
const draft = JSON.stringify({ tripName: '이전 여행', places: [], startDate: '', endDate: '' });

describe('syncLocalDataOwner', () => {
  beforeEach(() => window.localStorage.clear());

  it('다른 계정으로 로그인하면 이전 계정의 작성 중 여행을 지운다', () => {
    syncLocalDataOwner(1);
    window.localStorage.setItem(DRAFT_KEY, draft);

    syncLocalDataOwner(2);

    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('같은 계정으로 다시 로그인하면 작성 중 여행을 남긴다', () => {
    syncLocalDataOwner(1);
    window.localStorage.setItem(DRAFT_KEY, draft);

    syncLocalDataOwner(1);

    expect(window.localStorage.getItem(DRAFT_KEY)).toBe(draft);
  });

  it('새로 가입하는 계정이면 남은 데이터를 지운다', () => {
    syncLocalDataOwner(1);
    window.localStorage.setItem(DRAFT_KEY, draft);

    syncLocalDataOwner(null);

    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});
