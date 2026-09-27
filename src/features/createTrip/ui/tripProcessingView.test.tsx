import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';
import { TripProcessingView } from './tripProcessingView';

function status(progress: TripProcessingStatusResponse['progress']): TripProcessingStatusResponse {
  return {
    tripId: 7,
    status: 'PROCESSING',
    progress,
    currentStep: null,
    result: null,
    error: null,
  };
}

function percent() {
  return screen.getByRole('progressbar').getAttribute('aria-valuenow');
}

describe('TripProcessingView', () => {
  it('업로드 구간은 0%에서 30%까지 차오른다', () => {
    render(<TripProcessingView uploadRatio={0} />);
    expect(percent()).toBe('0');

    render(<TripProcessingView uploadRatio={0.5} />);
    expect(screen.getAllByText('사진을 올리고 있어요')[1]).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')[1]).toHaveAttribute('aria-valuenow', '15');
  });

  it('분석 준비 구간은 업로드 구간 끝인 30%에 머문다', () => {
    render(<TripProcessingView uploadRatio={1} processingStatus={status(null)} />);

    expect(screen.getByText('사진 분석을 준비하고 있어요')).toBeInTheDocument();
    expect(percent()).toBe('30');
  });

  it('분석 구간은 30%에서 100%까지 이어진다', () => {
    render(
      <TripProcessingView uploadRatio={1} processingStatus={status({ done: 0, total: 30 })} />,
    );
    expect(percent()).toBe('30');
  });

  it('분석이 절반이면 65%를 표시한다', () => {
    render(
      <TripProcessingView uploadRatio={1} processingStatus={status({ done: 15, total: 30 })} />,
    );

    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('사진 15/30장을 분석하고 있어요')).toBeInTheDocument();
    expect(percent()).toBe('65');
  });

  it('분석이 끝나면 100%를 표시한다', () => {
    render(
      <TripProcessingView uploadRatio={1} processingStatus={status({ done: 30, total: 30 })} />,
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(percent()).toBe('100');
  });

  it('done이 total을 넘어도 100%를 넘기지 않는다', () => {
    render(
      <TripProcessingView uploadRatio={1} processingStatus={status({ done: 33, total: 30 })} />,
    );

    expect(percent()).toBe('100');
  });

  it('업로드에서 분석으로 넘어가도 퍼센트가 뒤로 가지 않는다', () => {
    const { unmount } = render(<TripProcessingView uploadRatio={0.99} />);
    const beforeSwitch = Number(percent());
    unmount();

    render(
      <TripProcessingView uploadRatio={1} processingStatus={status({ done: 0, total: 30 })} />,
    );

    expect(Number(percent())).toBeGreaterThanOrEqual(beforeSwitch);
  });
});
