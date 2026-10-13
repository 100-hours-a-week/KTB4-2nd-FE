import { apiClient } from '@/shared/api/browser';

export type RestoreAttachmentItem = {
  tripAttachmentId: number;
  tripPlaceId: number;
};

export async function restoreAttachment(item: RestoreAttachmentItem, csrfToken: string) {
  await apiClient.post(
    `/attachments/${item.tripAttachmentId}/restore`,
    { tripPlaceId: item.tripPlaceId },
    { headers: { 'X-CSRF-TOKEN': csrfToken } },
  );
}

export async function restoreAttachments(items: RestoreAttachmentItem[], csrfToken: string) {
  await apiClient.post(
    '/attachments/bulk-restore',
    { items },
    { headers: { 'X-CSRF-TOKEN': csrfToken } },
  );
}
