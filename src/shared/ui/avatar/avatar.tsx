'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';

export type AvatarSize = 'sm' | 'md';

export type AvatarProps = {
  /** 프로필 이미지 URL. 없거나 불러오지 못하면 fallback을 보여줍니다. */
  src?: string | null;
  /** 이미지의 대체 텍스트. 보통 사용자 닉네임을 넣습니다. */
  alt?: string;
  size?: AvatarSize;
  fallback?: ReactNode;
  className?: string;
};

const sizePx: Record<AvatarSize, number> = { sm: 36, md: 48 };
const sizeClassName: Record<AvatarSize, string> = { sm: 'size-9', md: 'size-12' };

export function Avatar({ src, alt = '', size = 'md', fallback, className = '' }: AvatarProps) {
  // 실패한 URL 자체를 기억해 두면 src가 바뀔 때 별도 초기화 없이 다시 시도합니다.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span
      className={`border-border-subtle bg-surface text-muted relative grid shrink-0 place-items-center overflow-hidden rounded-full border ${sizeClassName[size]} ${className}`}
    >
      {fallback ?? <PersonIcon size={size === 'md' ? 24 : 18} />}
      {showImage && (
        <Image
          src={src!}
          alt={alt}
          width={sizePx[size]}
          height={sizePx[size]}
          // SSR된 이미지가 hydration 전에 실패하면 error 이벤트를 놓치므로 ref에서 한 번 더 확인합니다.
          ref={(node) => {
            if (node?.complete && node.naturalWidth === 0) setFailedSrc(src!);
          }}
          onError={() => setFailedSrc(src!)}
          className="bg-surface absolute inset-0 size-full object-cover"
        />
      )}
    </span>
  );
}

function PersonIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <circle cx="12" cy="9" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
