import styles from './skeleton.module.css';

export type SkeletonProps = {
  className?: string;
  circle?: boolean;
  animation?: 'pulse' | 'breathe' | 'none';
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
