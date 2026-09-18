import { mutationOptions } from '@tanstack/react-query';

import { startKakaoLogin } from '@/features/kakaoLogin/api/startKakaoLogin';

export const kakaoLoginQueries = {
  allKeys: () => ['kakaoLogin'] as const,
  startKeys: () => [...kakaoLoginQueries.allKeys(), 'start'] as const,
  start: () =>
    mutationOptions({
      mutationKey: kakaoLoginQueries.startKeys(),
      mutationFn: startKakaoLogin,
    }),
};
