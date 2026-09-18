import { mutationOptions } from '@tanstack/react-query';

import {
  completeSignup,
  type CompleteSignupRequest,
} from '@/features/completeSignup/api/completeSignup';

export const completeSignupQueries = {
  allKeys: () => ['signup'] as const,
  completeKeys: () => [...completeSignupQueries.allKeys(), 'complete'] as const,
  complete: () =>
    mutationOptions({
      mutationKey: completeSignupQueries.completeKeys(),
      mutationFn: (request: CompleteSignupRequest) => completeSignup(request),
    }),
};
