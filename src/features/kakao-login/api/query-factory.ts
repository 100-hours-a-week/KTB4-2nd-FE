import { mutationOptions } from '@tanstack/react-query';

import { startKakaoLogin } from './start-kakao-login';

export const kakaoLoginQueryFactory = {
  start: () =>
    mutationOptions({
      mutationKey: ['kakao-login', 'start'],
      mutationFn: () => startKakaoLogin(),
    }),
};
