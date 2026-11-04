'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createPreviewBlob } from '../../model/createPreviewBlob';
import { prepareHeicPreviewDecoder } from '../../model/heicPreviewDecoder';
import { HeicPreviewResourceError } from '../../model/heicPreviewError';
import { ImageUploadFieldView } from './imageUploadFieldView';
import { ImagePreviewFeedback } from './imagePreviewFeedback';

type ImageUploadFieldProps = {
  files: File[];
  error?: string;
  disabled?: boolean;
  onSelect: (files: File[]) => void;
  onRemove: (index: number) => void;
  /** 사진을 열 수 없어(디코딩 실패) 미리보기가 불가능하거나, 다시 가능해졌을 때 알립니다. */
  onPreviewBrokenChange?: (file: File, broken: boolean) => void;
};

const PREVIEW_ROOT_MARGIN = '300px 0px';
const PREVIEW_READY_EVENT = 'heic-preview-ready';

export function ImageUploadField({
  files,
  error,
  disabled = false,
  onSelect,
  onRemove,
  onPreviewBrokenChange,
}: ImageUploadFieldProps) {
  const { scrollRootRef, registerCard, getPreviewPriority } = usePreviewPriorities(files);

  useEffect(() => {
    let active = true;
    let preparing = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let retryDelay = 5_000;
    const prepare = () => {
      if (!active || preparing) return;
      clearTimeout(retryTimer);
      preparing = true;
      void prepareHeicPreviewDecoder()
        .then(() => {
          if (active) window.dispatchEvent(new Event(PREVIEW_READY_EVENT));
          retryDelay = 5_000;
        })
        .catch((error: unknown) => {
          if (active && error instanceof HeicPreviewResourceError && error.kind === 'network') {
            retryTimer = setTimeout(prepare, retryDelay);
            retryDelay = Math.min(retryDelay * 2, 30_000);
          }
        })
        .finally(() => {
          preparing = false;
        });
    };
    prepare();
    window.addEventListener('online', prepare);
    return () => {
      active = false;
      clearTimeout(retryTimer);
      window.removeEventListener('online', prepare);
    };
  }, []);

  return (
    <ImageUploadFieldView
      error={error}
      disabled={disabled}
      scrollRootRef={scrollRootRef}
      onSelect={onSelect}
      onRemove={onRemove}
      items={files.map((file, index) => {
        const fileId = getFileIdentity(file);
        return {
          id: fileId,
          fileName: file.name,
          ref: (element: HTMLLIElement | null) => registerCard(fileId, element),
          preview: (
            <ImagePreview
              file={file}
              delayMs={(index % 3) * 120}
              getPreviewPriority={getPreviewPriority}
              onBrokenChange={onPreviewBrokenChange}
              disabled={disabled}
            />
          ),
        };
      })}
    />
  );
}

function getFileIdentity(file: File) {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}`;
}

function usePreviewPriorities(files: File[]) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const cardElementsRef = useRef(new Map<string, HTMLLIElement>());
  const nearFileIdsRef = useRef(new Set<string>());

  const getPreviewPriority = useCallback(
    (fileId: string) => (nearFileIdsRef.current.has(fileId) ? 1 : 0),
    [],
  );

  const registerCard = useCallback((fileId: string, element: HTMLLIElement | null) => {
    if (element) {
      cardElementsRef.current.set(fileId, element);
      return;
    }

    cardElementsRef.current.delete(fileId);
  }, []);

  useEffect(() => {
    const nearFileIds = nearFileIdsRef.current;
    const currentFileIds = new Set(files.map(getFileIdentity));
    for (const fileId of nearFileIds) {
      if (!currentFileIds.has(fileId)) nearFileIds.delete(fileId);
    }
    const root = scrollRootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const fileIdByElement = new Map<Element, string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const fileId = fileIdByElement.get(entry.target);
          if (!fileId) continue;
          if (entry.isIntersecting) nearFileIds.add(fileId);
          else nearFileIds.delete(fileId);
        }
      },
      {
        root,
        rootMargin: PREVIEW_ROOT_MARGIN,
        threshold: 0.01,
      },
    );

    for (const [fileId, element] of cardElementsRef.current) {
      if (!currentFileIds.has(fileId)) continue;
      fileIdByElement.set(element, fileId);
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [files]);

  return {
    scrollRootRef,
    registerCard,
    getPreviewPriority,
  };
}

function ImagePreview({
  file,
  delayMs,
  getPreviewPriority,
  onBrokenChange,
  disabled,
}: {
  file: File;
  delayMs: number;
  getPreviewPriority: (fileId: string) => number;
  onBrokenChange?: (file: File, broken: boolean) => void;
  disabled: boolean;
}) {
  const onBrokenChangeRef = useRef(onBrokenChange);
  useEffect(() => {
    onBrokenChangeRef.current = onBrokenChange;
  });
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [failure, setFailure] = useState<{
    file: File;
    kind: 'network' | 'module' | 'conversion';
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setFailure(null);
    setAttempt((previous) => previous + 1);
  }, []);

  useEffect(() => {
    if (failure?.file !== file || failure.kind === 'conversion') return;
    window.addEventListener(PREVIEW_READY_EVENT, retry);
    return () => window.removeEventListener(PREVIEW_READY_EVENT, retry);
  }, [failure, file, retry]);

  useEffect(() => {
    let active = true;
    let previewUrl: string | null = null;
    const abortController = new AbortController();

    void createPreviewBlob(file, abortController.signal, () =>
      getPreviewPriority(getFileIdentity(file)),
    )
      .then((previewBlob) => {
        if (!active) return;
        previewUrl = URL.createObjectURL(previewBlob);
        setPreview({ file, url: previewUrl });
        onBrokenChangeRef.current?.(file, false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const kind =
          error instanceof HeicPreviewResourceError
            ? navigator.onLine
              ? error.kind
              : 'network'
            : 'conversion';
        setFailure({ file, kind });
        // 네트워크·모듈 문제는 환경 탓이라 사진 자체는 정상일 수 있어 막지 않습니다.
        if (kind === 'conversion') onBrokenChangeRef.current?.(file, true);
      });

    return () => {
      active = false;
      abortController.abort();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file, getPreviewPriority, attempt]);

  const url = preview?.file === file ? preview.url : null;

  if (failure?.file === file) {
    return (
      <ImagePreviewFeedback
        fileName={file.name}
        kind={failure.kind}
        disabled={disabled}
        onRetry={retry}
      />
    );
  }

  if (!url) {
    return (
      <ImagePreviewFeedback fileName={file.name} kind="loading" delayMs={delayMs} onRetry={retry} />
    );
  }

  return (
    <Image
      src={url}
      alt={file.name}
      fill
      sizes="(max-width: 430px) 33vw, 130px"
      unoptimized
      className="object-cover"
      onError={() => {
        setFailure({ file, kind: 'conversion' });
        onBrokenChangeRef.current?.(file, true);
      }}
    />
  );
}
