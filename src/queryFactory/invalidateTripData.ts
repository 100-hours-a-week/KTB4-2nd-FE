import type { QueryClient } from '@tanstack/react-query';

import { mainMapQueries } from './mainMapQueries';
import { photoListQueries } from './photoListQueries';
import { storyCreateQueries } from './storyCreateQueries';
import { tripDetailQueries } from './tripDetailQueries';
import { tripListQueries } from './tripListQueries';
import { unclassifiedPhotosQueries } from './unclassifiedPhotosQueries';
import { userStatsQueries } from './userStatsQueries';

export function invalidateTripData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() }),
    queryClient.invalidateQueries({ queryKey: mainMapQueries.markers().queryKey }),
    queryClient.invalidateQueries({ queryKey: tripDetailQueries.allKeys() }),
    queryClient.invalidateQueries({ queryKey: photoListQueries.allKeys() }),
    queryClient.invalidateQueries({ queryKey: unclassifiedPhotosQueries.allKeys() }),
    queryClient.invalidateQueries({
      queryKey: [...storyCreateQueries.allKeys(), 'sourceFolders'],
    }),
    queryClient.invalidateQueries({ queryKey: userStatsQueries.allKeys() }),
  ]);
}
