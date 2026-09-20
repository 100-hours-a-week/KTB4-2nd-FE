'use client';

import Image from 'next/image';
import { useEffect, useState, type ChangeEvent } from 'react';

import { TRIP_IMAGE_MAX_COUNT } from '../model/imageValidation';

type ImageUploadFieldProps = {
  files: File[];
  error?: string;
  onSelect: (files: File[]) => void;
  onRemove: (index: number) => void;
};

export function ImageUploadField({ files, error, onSelect, onRemove }: ImageUploadFieldProps) {
  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    onSelect(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  return (
    <div>
      <label
        htmlFor="trip-images"
        className="border-field-border focus-within:outline-brand flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center focus-within:outline-2 focus-within:outline-offset-2"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4m0 0L8 8m4-4 4 4" />
            <path d="M5 14v5h14v-5" />
          </svg>
        </span>
        <span className="text-brand mt-2 text-sm font-semibold">눌러서 사진 선택하기</span>
        <span className="text-muted mt-1 text-xs">JPG · PNG · HEIC</span>
        <input
          id="trip-images"
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
          multiple
          onChange={selectFiles}
          className="sr-only"
        />
      </label>

      {error && (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      )}

      <div className="text-muted mt-6 flex items-center justify-between text-xs">
        <span>선택된 사진</span>
        <span>
          {files.length}/{TRIP_IMAGE_MAX_COUNT}장
        </span>
      </div>

      {files.length > 0 && (
        <ul className="mt-2 grid grid-cols-3 gap-1.5" aria-label="선택한 사진 목록">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="relative aspect-square overflow-hidden rounded-md bg-slate-100"
            >
              <ImagePreview file={file} />
              <button
                type="button"
                aria-label={`${file.name} 삭제`}
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-slate-700/65 text-lg leading-none text-white"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ImagePreview({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));
  const [failed, setFailed] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  if (failed) {
    return (
      <div className="text-muted flex size-full flex-col items-center justify-center px-2 text-center text-[10px]">
        <span>미리보기 불가</span>
        <span className="mt-1 max-w-full truncate">{file.name}</span>
      </div>
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
      onError={() => setFailed(true)}
    />
  );
}
