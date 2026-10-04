import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { Skeleton } from './skeleton';
import styles from './skeleton.module.css';

it('기본 스켈레톤은 기존 pulse를 유지하고 움직임 줄이기를 지원한다', () => {
  const { container } = render(<Skeleton className="h-4 w-20" />);
  const skeleton = container.querySelector('span');
  expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  expect(skeleton).toHaveClass('animate-pulse', 'motion-reduce:animate-none', 'h-4', 'w-20');
});

it('breathe는 카드별 시차를 가진 은은한 호흡 모션을 사용한다', () => {
  const { container } = render(<Skeleton animation="breathe" delayMs={120} circle />);
  const skeleton = container.querySelector('span');
  expect(skeleton).toHaveClass(styles.breathe, 'rounded-full');
  expect(skeleton).not.toHaveClass('animate-pulse');
  expect(skeleton).toHaveStyle({ animationDelay: '120ms' });
});

it('오류 상태처럼 로딩이 아닌 경우 애니메이션을 끌 수 있다', () => {
  const { container } = render(<Skeleton animation="none" />);
  const skeleton = container.querySelector('span');
  expect(skeleton).not.toHaveClass('animate-pulse', styles.breathe);
  expect(skeleton).not.toHaveAttribute('style');
});
