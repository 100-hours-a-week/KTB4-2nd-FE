export type SkeletonProps = {
  className?: string;
  /** 원형 스켈레톤이 필요할 때 사용합니다. */
  circle?: boolean;
};

export function Skeleton({ className = '', circle = false }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse bg-slate-200/80 ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
    />
  );
}
