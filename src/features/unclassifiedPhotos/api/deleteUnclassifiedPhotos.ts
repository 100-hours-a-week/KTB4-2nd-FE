import { removeMockUnclassifiedPhotos, waitMockDelay } from './unclassifiedMock';

export async function deleteUnclassifiedPhotos(tripId: number, photoIds: number[]) {
  await waitMockDelay();
  removeMockUnclassifiedPhotos(tripId, photoIds);
}
