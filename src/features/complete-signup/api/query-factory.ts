import { mutationOptions } from '@tanstack/react-query';

import { completeSignup, type CompleteSignupRequest } from './complete-signup';

export const completeSignupQueryFactory = {
  complete: () =>
    mutationOptions({
      mutationKey: ['signup', 'complete'],
      mutationFn: (request: CompleteSignupRequest) => completeSignup(request),
    }),
};
