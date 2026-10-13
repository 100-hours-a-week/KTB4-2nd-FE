import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  CalendarIcon,
  ChevronIcon,
  CheckIcon,
  ImageIcon,
  KakaoIcon,
  NavigationIcon,
  RestoreIcon,
  SparkleIcon,
} from './index';

describe('공통 아이콘', () => {
  it('기본 크기와 SVG 속성, 장식용 접근성 처리를 공유한다', () => {
    const { container } = render(<RestoreIcon />);
    const svg = container.querySelector('svg')!;

    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '1.8');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('화면별 크기, 선 두께, 색상과 className을 적용한다', () => {
    render(
      <RestoreIcon
        size={13}
        strokeWidth={2}
        stroke="#ffb1a9"
        className="text-brand"
        data-testid="icon"
      />,
    );
    const svg = screen.getByTestId('icon');
    expect(svg).toHaveAttribute('width', '13');
    expect(svg).toHaveAttribute('height', '13');
    expect(svg).toHaveAttribute('stroke-width', '2');
    expect(svg).toHaveAttribute('stroke', '#ffb1a9');
    expect(svg).toHaveClass('text-brand');
  });

  it('width와 height를 지정하면 size보다 우선하고 SVG ref도 전달한다', () => {
    const ref = vi.fn();
    render(<RestoreIcon size={24} width={18} height={20} ref={ref} data-testid="icon" />);
    expect(screen.getByTestId('icon')).toHaveAttribute('width', '18');
    expect(screen.getByTestId('icon')).toHaveAttribute('height', '20');
    expect(ref).toHaveBeenCalledWith(screen.getByTestId('icon'));
  });

  it('접근성 이름을 지정한 아이콘은 이미지로 노출한다', () => {
    render(<RestoreIcon aria-label="사진 복구" />);
    expect(screen.getByRole('img', { name: '사진 복구' })).not.toHaveAttribute('aria-hidden');
  });

  it('외부 이름 참조와 명시적인 aria-hidden도 지원한다', () => {
    const { rerender } = render(
      <>
        <span id="icon-label">사진 복구</span>
        <RestoreIcon aria-labelledby="icon-label" />
      </>,
    );
    expect(screen.getByRole('img', { name: '사진 복구' })).not.toHaveAttribute('aria-hidden');
    rerender(<RestoreIcon aria-label="사진 복구" aria-hidden="true" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('같은 의미지만 도형이 다른 아이콘은 variant로 유지한다', () => {
    const { container, rerender } = render(<ImageIcon />);
    expect(container.querySelector('circle')).toHaveAttribute('cx', '8.5');
    rerender(<ImageIcon variant="story" />);
    expect(container.querySelector('circle')).toHaveAttribute('cx', '8');
    rerender(<CalendarIcon variant="rounded" />);
    expect(container.querySelector('rect')).toHaveAttribute('rx', '3');
    rerender(<CheckIcon variant="selection" />);
    expect(container.querySelector('path')).toHaveAttribute('d', 'M5 12.5l4.5 4.5L19 7.5');
  });

  it('채움형 아이콘에 윤곽선을 추가하지 않고 색상 재정의를 지원한다', () => {
    const { container, rerender } = render(<SparkleIcon />);
    expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
    expect(container.querySelector('svg')).toHaveAttribute('stroke', 'none');
    rerender(<KakaoIcon size={20} fill="#000000" />);
    expect(container.querySelector('svg')).toHaveAttribute('fill', '#000000');
    expect(container.querySelector('svg')).toHaveAttribute('stroke', 'none');
  });

  it('이전·다음 화살표를 같은 인터페이스로 사용한다', () => {
    const { container, rerender } = render(<ChevronIcon direction="left" />);
    expect(container.querySelector('path')).toHaveAttribute('d', 'm15 18-6-6 6-6');
    rerender(<ChevronIcon direction="right" />);
    expect(container.querySelector('path')).toHaveAttribute('d', 'm9 18 6-6-6-6');
  });

  it('하단 메뉴의 종류와 선 두께를 유지한다', () => {
    const { container, rerender } = render(<NavigationIcon name="plus" />);
    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '2.4');
    expect(container.querySelector('path')).toHaveAttribute('d', 'M12 5v14M5 12h14');
    rerender(<NavigationIcon name="profile" />);
    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '1.8');
    expect(container.querySelector('circle')).toHaveAttribute('cy', '8');
    rerender(<NavigationIcon name="search" />);
    expect(container.querySelector('circle')).toHaveAttribute('r', '7');
  });
});
