import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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
  it('여행 만들기 헤더를 표시하고 업로드 중에는 뒤로가기를 막는다', () => {
    render(<TripProcessingView uploadRatio={0.5} />);

    expect(screen.getByRole('heading', { name: '여행 만들기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전 단계로 이동' })).toBeDisabled();
  });

  it('AI 처리 중 뒤로가기를 누르면 생성 취소 확인 모달을 표시한다', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <TripProcessingView
        uploadRatio={1}
        processingStatus={status({ done: 1, total: 30 })}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: '이전 단계로 이동' }));

    expect(screen.getByRole('dialog', { name: '아직 폴더를 생성 중입니다.' })).toBeInTheDocument();
    expect(
      screen.getByText('여행 생성을 취소하면 사진 업로드 페이지로 돌아가요.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '이어서 만들기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '이전 단계로 이동' }));
    await user.click(screen.getByRole('button', { name: '취소하기' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('AI 처리 중 다른 작업 이어하기를 제공한다', async () => {
    const user = userEvent.setup();
    const onContinueElsewhere = vi.fn();

    render(
      <TripProcessingView
        uploadRatio={1}
        processingStatus={status({ done: 1, total: 30 })}
        onContinueElsewhere={onContinueElsewhere}
      />,
    );

    await user.click(screen.getByRole('button', { name: '다른 작업 이어하기' }));
    expect(onContinueElsewhere).toHaveBeenCalledOnce();
  });

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
