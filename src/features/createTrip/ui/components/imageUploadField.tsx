'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';

import { CloseIcon, PlusIcon } from '@/shared/ui/icons';
import { Skeleton } from '@/shared/ui/skeleton';

import { createPreviewBlob } from '../../model/createPreviewBlob';
import { prepareHeicPreviewDecoder } from '../../model/heicPreviewDecoder';
import { HeicPreviewResourceError } from '../../model/heicPreviewError';
import { TRIP_IMAGE_MAX_COUNT } from '../../model/imageValidation';

type ImageUploadFieldProps = {
  files: File[];
  error?: string;
  onSelect: (files: File[]) => void;
  onRemove: (index: number) => void;
};

const PREVIEW_ROOT_MARGIN = '300px 0px';
const PREVIEW_READY_EVENT = 'heic-preview-ready';

export function ImageUploadField({ files, error, onSelect, onRemove }: ImageUploadFieldProps) {
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

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    onSelect(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-end justify-between gap-3">
        <div>
          <p className="text-brand text-sm font-bold">선택한 사진</p>
          <p className="text-muted mt-0.5 text-[11px]">JPG, PNG, HEIC 사진을 올릴 수 있어요</p>
        </div>
        <span className="text-muted inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#eef3f9] px-2.5 text-xs leading-none whitespace-nowrap tabular-nums">
          <strong className="text-brand">{files.length}</strong> / {TRIP_IMAGE_MAX_COUNT}장
        </span>
      </div>

      {error && (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      )}

      <div
        ref={scrollRootRef}
        role="region"
        aria-label="선택한 사진 스크롤 영역"
        className="mt-3 min-h-0 flex-1 overflow-y-auto pb-2"
      >
        <ul className="grid grid-cols-3 gap-1.5" aria-label="선택한 사진 목록">
          <li role="presentation" className="aspect-square">
            <label
              htmlFor="trip-images"
              className="text-brand has-[:focus-visible]:ring-brand flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg bg-[#eef3f9] transition-colors hover:bg-[#e3eaf3] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset"
            >
              <PlusIcon strokeWidth="2" strokeLinecap="round" size="22" />
              <span className="text-xs font-semibold">사진 추가</span>
              <input
                id="trip-images"
                type="file"
                accept="image/jpeg,image/png,image/heic,.jpg,.jpeg,.png,.heic"
                multiple
                onChange={selectFiles}
                className="sr-only"
              />
            </label>
          </li>
          {files.map((file, index) => {
            const fileId = getFileIdentity(file);

            return (
              <li
                ref={(element) => registerCard(fileId, element)}
                key={fileId}
                className="relative aspect-square overflow-hidden rounded-lg bg-slate-100"
              >
                <ImagePreview
                  file={file}
                  delayMs={(index % 3) * 120}
                  getPreviewPriority={getPreviewPriority}
                />
                <button
                  type="button"
                  aria-label={`${file.name} 삭제`}
                  onClick={() => onRemove(index)}
                  className="focus-visible:outline-brand absolute top-1.5 right-1.5 grid size-6 cursor-pointer place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-2"
                >
                  <CloseIcon strokeWidth="2.6" strokeLinecap="round" size="11" />
                </button>
              </li>
            );
          })}
          {files.length === 0 &&
            Array.from({ length: 5 }, (_, index) => (
              <li
                key={index}
                role="presentation"
                aria-hidden="true"
                className="bg-surface-subtle aspect-square rounded-lg"
              />
            ))}
        </ul>
        {files.length === 0 && (
          <p className="text-muted mt-4 text-center text-xs">
            위치 정보가 담긴 사진이면 장소별 폴더로 나눠드려요.
          </p>
        )}
      </div>
    </div>
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
}: {
  file: File;
  delayMs: number;
  getPreviewPriority: (fileId: string) => number;
}) {
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
      });

    return () => {
      active = false;
      abortController.abort();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file, getPreviewPriority, attempt]);

  const url = preview?.file === file ? preview.url : null;

  if (failure?.file === file) {
    const message = {
      network: '인터넷 연결을 기다리고 있어요',
      module: '미리보기 준비에 실패했어요',
      conversion: '미리보기 불가',
    }[failure.kind];
    return (
      <div className="text-muted flex size-full flex-col items-center justify-center px-2 text-center text-[10px]">
        <span role="status">{message}</span>
        <span className="mt-1 max-w-full truncate">{file.name}</span>
        <button
          type="button"
          aria-label={`${file.name} 미리보기 다시 시도`}
          onClick={retry}
          className="text-brand mt-2 cursor-pointer rounded px-2 py-1 font-semibold underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!url) {
    return <Skeleton animation="breathe" delayMs={delayMs} className="size-full rounded-none" />;
  }

  return (
    <Image
      src={url}
      alt={file.name}
      fill
      sizes="(max-width: 430px) 33vw, 130px"
      unoptimized
      className="object-cover"
      onError={() => setFailure({ file, kind: 'conversion' })}
    />
  );
}
