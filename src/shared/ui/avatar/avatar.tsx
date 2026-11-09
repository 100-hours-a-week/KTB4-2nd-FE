'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';

import { PersonIcon } from '@/shared/ui/icons';

export type AvatarSize = 'xs' | 'sm' | 'md';

export type AvatarProps = {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  fallback?: ReactNode;
  className?: string;
};

const sizePx: Record<AvatarSize, number> = { xs: 24, sm: 36, md: 48 };
const sizeClassName: Record<AvatarSize, string> = { xs: 'size-6', sm: 'size-9', md: 'size-12' };
const iconPx: Record<AvatarSize, number> = { xs: 14, sm: 18, md: 24 };

export function Avatar({ src, alt = '', size = 'md', fallback, className = '' }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span
      className={`border-border-subtle bg-surface text-muted relative grid shrink-0 place-items-center overflow-hidden rounded-full border ${sizeClassName[size]} ${className}`}
    >
      {fallback ?? <PersonIcon strokeWidth="1.7" strokeLinecap="round" size={iconPx[size]} />}
      {showImage && (
        <Image
          src={src!}
          alt={alt}
          width={sizePx[size]}
          height={sizePx[size]}
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
