import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginPage } from './loginPage';

vi.mock('@/features/kakaoLogin', () => ({ KakaoLoginButton: () => null }));

describe('LoginPage 임시 데이터 정리', () => {
  it('로그인 화면에 오면 이전 사용자의 작성 중 여행·스토리와 진행 중 작업 기록을 지운다', () => {
    window.localStorage.setItem(
      'trip-create-draft-v1',
      JSON.stringify({ tripName: '이전 여행', places: [], startDate: '', endDate: '' }),
    );
    window.localStorage.setItem('story-create-draft-v1:7', '{}');
    window.localStorage.setItem(
      'trip-processing-pending-v1',
      JSON.stringify([{ tripId: 7, kind: 'create' }]),
    );
    window.localStorage.setItem('unrelated-preference', 'keep');

    render(<LoginPage />);

    expect(window.localStorage.getItem('trip-create-draft-v1')).toBeNull();
    expect(window.localStorage.getItem('story-create-draft-v1:7')).toBeNull();
    expect(window.localStorage.getItem('trip-processing-pending-v1')).toBeNull();
    expect(window.localStorage.getItem('unrelated-preference')).toBe('keep');
  });
});
