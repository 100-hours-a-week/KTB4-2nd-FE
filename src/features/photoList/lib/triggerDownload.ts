'use client';

/** 발급받은 URL로 브라우저 다운로드를 시작합니다. */
export function triggerDownload(url: string, fileName?: string) {
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.rel = 'noopener';
  if (fileName) anchor.download = fileName;

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
