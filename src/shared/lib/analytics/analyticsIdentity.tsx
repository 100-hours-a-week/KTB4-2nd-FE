'use client';

import { useEffect } from 'react';

import { identify } from './analytics';

export function AnalyticsIdentity({ userId }: { userId: number }) {
  useEffect(() => {
    identify(userId, { signup_method: 'kakao' });
  }, [userId]);

  return null;
}
