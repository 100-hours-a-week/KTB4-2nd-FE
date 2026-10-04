import styles from './skeleton.module.css';

export type SkeletonProps = {
  className?: string;
  /** 원형 스켈레톤이 필요할 때 사용합니다. */
  circle?: boolean;
  animation?: 'pulse' | 'breathe' | 'none';
  /** Breathing 모션의 시작 시차를 밀리초 단위로 지정합니다. */
  delayMs?: number;
};

export function Skeleton({
  className = '',
  circle = false,
  animation = 'pulse',
  delayMs = 0,
}: SkeletonProps) {
  const animationClass =
    animation === 'breathe'
      ? styles.breathe
      : animation === 'pulse'
        ? 'animate-pulse motion-reduce:animate-none'
        : '';

  return (
    <span
      aria-hidden="true"
      style={animation === 'breathe' ? { animationDelay: `${delayMs}ms` } : undefined}
      className={`block bg-slate-200/80 ${animationClass} ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
    />
  );
}
