import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { ImageUploadField } from './imageUploadField';

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

afterEach(() => {
  if (originalCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
  else Reflect.deleteProperty(URL, 'createObjectURL');
  if (originalRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
  else Reflect.deleteProperty(URL, 'revokeObjectURL');
});

it('Strict Mode에서도 사진 미리보기의 blob URL이 유효하다', async () => {
  const activeUrls = new Set<string>();
  let sequence = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => {
      const url = `blob:http://localhost:3000/preview-${++sequence}`;
      activeUrls.add(url);
      return url;
    }),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn((url: string) => activeUrls.delete(url)),
  });

  const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
  const { unmount } = render(
    <StrictMode>
      <ImageUploadField files={[file]} onSelect={vi.fn()} onRemove={vi.fn()} />
    </StrictMode>,
  );

  const previewUrl = (await screen.findByRole('img', { name: 'photo.jpg' })).getAttribute('src');
  expect(previewUrl).not.toBeNull();
  expect(activeUrls.has(previewUrl!)).toBe(true);
  expect(activeUrls.size).toBe(1);

  unmount();
  expect(activeUrls.size).toBe(0);
});
