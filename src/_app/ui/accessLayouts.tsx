import type { PropsWithChildren } from 'react';

export function PublicLayout({ children }: PropsWithChildren) {
  return children;
}

/** 보호 여부는 레이아웃 재사용에 의존하지 않고 각 페이지의 서버 인증 검사로 결정합니다. */
export function ProtectedLayout({ children }: PropsWithChildren) {
  return children;
}
