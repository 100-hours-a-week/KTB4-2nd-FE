import type { PhotoAccent } from '@/features/photoList';
import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { UnclassifiedFolder, UnclassifiedIssue } from '../model/types';

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
  const { data } = await apiClient.get<ApiResponse<UnclassifiedFolderListResponse>>(
    `/trips/${tripId}/unclassified-folders`,
  );

  return data.data.folders.map((folder) => ({
    issue: folder.issue,
    photoCount: folder.attachmentCount,
    thumbnailUrl: folder.representativeAttachment?.thumbnailUrl ?? null,
    accent: FOLDER_ACCENTS[folder.issue],
  }));
}
