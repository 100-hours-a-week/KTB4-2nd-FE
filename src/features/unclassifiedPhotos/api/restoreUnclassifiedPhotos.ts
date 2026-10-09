import type { UnclassifiedIssue } from '../model/types';
import {
  clearMockUnclassifiedIssue,
  removeMockUnclassifiedPhotos,
  waitMockDelay,
} from './unclassifiedMock';

export type RestoreUnclassifiedTarget = { issue: UnclassifiedIssue } | { photoIds: number[] };

export async function restoreUnclassifiedPhotos(tripId: number, target: RestoreUnclassifiedTarget) {
  await waitMockDelay();

  if ('issue' in target) clearMockUnclassifiedIssue(tripId, target.issue);
  else removeMockUnclassifiedPhotos(tripId, target.photoIds);
}
