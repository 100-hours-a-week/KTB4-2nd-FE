'use client';

export function triggerDownload(url: string, fileName?: string) {
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.rel = 'noopener';
  if (fileName) anchor.download = fileName;

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
