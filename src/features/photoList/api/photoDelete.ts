import { apiClient } from '@/shared/api/browser';

export async function deletePhoto(photoId: number, csrfToken: string): Promise<void> {
  await apiClient.delete(`/attachments/${photoId}`, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
  });
}

export async function deletePhotos(photoIds: number[], csrfToken: string): Promise<void> {
  await apiClient.post(
    '/attachments/bulk-delete',
    { tripAttachmentIds: photoIds },
    { headers: { 'X-CSRF-TOKEN': csrfToken } },
  );
}
