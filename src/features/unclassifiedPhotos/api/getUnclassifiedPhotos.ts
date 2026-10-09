import type { PhotoListItem } from '@/features/photoList';

import type { UnclassifiedIssue } from '../model/types';
import { getMockUnclassifiedPhotos, waitMockDelay } from './unclassifiedMock';

export async function getUnclassifiedPhotos(
  tripId: number,
  issue: UnclassifiedIssue,
): Promise<PhotoListItem[]> {
  await waitMockDelay();
  return [...getMockUnclassifiedPhotos(tripId)[issue]];
}
