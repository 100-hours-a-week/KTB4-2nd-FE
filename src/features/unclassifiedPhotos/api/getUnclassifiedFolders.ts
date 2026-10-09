import type { PhotoAccent } from '@/features/photoList';

import {
  UNCLASSIFIED_ISSUES,
  type UnclassifiedFolder,
  type UnclassifiedIssue,
} from '../model/types';
import { getMockUnclassifiedPhotos, waitMockDelay } from './unclassifiedMock';

export type UnclassifiedFolderListResponse = {
  folders: {
    issue: UnclassifiedIssue;
    name: string;
    attachmentCount: number;
    representativeAttachment: { tripAttachmentId: number; thumbnailUrl: string | null } | null;
  }[];
};

const FOLDER_ACCENTS: Record<UnclassifiedIssue, PhotoAccent> = {
  UNCLEAR_LOCATION: 'island',
  BLURRY: 'night',
  DUPLICATED: 'coast',
};

export async function getUnclassifiedFolders(tripId: number): Promise<UnclassifiedFolder[]> {
  await waitMockDelay();
  const photos = getMockUnclassifiedPhotos(tripId);

  return toUnclassifiedFolders({
    folders: UNCLASSIFIED_ISSUES.map((issue) => ({
      issue,
      name: issue,
      attachmentCount: photos[issue].length,
      representativeAttachment: photos[issue][0]
        ? { tripAttachmentId: photos[issue][0].id, thumbnailUrl: null }
        : null,
    })),
  });
}

function toUnclassifiedFolders(response: UnclassifiedFolderListResponse): UnclassifiedFolder[] {
  return response.folders.map((folder) => ({
    issue: folder.issue,
    photoCount: folder.attachmentCount,
    thumbnailUrl: folder.representativeAttachment?.thumbnailUrl ?? null,
    accent: FOLDER_ACCENTS[folder.issue],
  }));
}
