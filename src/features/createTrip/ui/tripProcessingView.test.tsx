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

describe('TripProcessingView', () => {
  it('여행 만들기 헤더를 표시하고 업로드 중에는 뒤로가기를 막는다', () => {
    render(<TripProcessingView uploadRatio={0.5} />);

    expect(screen.getByRole('heading', { name: '여행 만들기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전 단계로 이동' })).toBeDisabled();
  });

  it('AI 처리 중 여행 생성 취소하기 버튼을 누르면 확인 모달을 거쳐 취소한다', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <TripProcessingView
        uploadRatio={1}
        processingStatus={status({ done: 1, total: 30 })}
        onCancel={onCancel}
        onContinueElsewhere={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '여행 생성 취소하기' }));

    expect(screen.getByRole('dialog', { name: '아직 폴더를 생성 중입니다.' })).toBeInTheDocument();
    expect(
      screen.getByText('여행 생성을 취소하면 사진 업로드 페이지로 돌아가요.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '이어서 만들기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '여행 생성 취소하기' }));
    await user.click(screen.getByRole('button', { name: '취소하기' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('AI 처리 중 뒤로가기는 취소 모달 없이 다른 작업으로 나간다', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onContinueElsewhere = vi.fn();

    render(
      <TripProcessingView
        uploadRatio={1}
        processingStatus={status({ done: 1, total: 30 })}
        onCancel={onCancel}
        onContinueElsewhere={onContinueElsewhere}
      />,
    );

    await user.click(screen.getByRole('button', { name: '이전 단계로 이동' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onContinueElsewhere).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('업로드 중에는 여행 생성 취소하기를 누를 수 없다', () => {
    render(
      <TripProcessingView uploadRatio={0.5} onCancel={vi.fn()} onContinueElsewhere={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: '여행 생성 취소하기' })).toBeDisabled();
  });

  it('수정·진행률 화면처럼 취소를 넘기지 않으면 취소 버튼을 보여주지 않는다', () => {
    render(<TripProcessingView uploadRatio={1} onContinueElsewhere={vi.fn()} />);

    expect(screen.queryByRole('button', { name: '여행 생성 취소하기' })).not.toBeInTheDocument();
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

  it('퍼센트와 진행 바 없이 빙글 도는 상태 표시만 보여준다', () => {
    render(
      <TripProcessingView uploadRatio={1} processingStatus={status({ done: 15, total: 30 })} />,
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('업로드 중에는 업로드 문구를 보여주고 다른 작업 이어하기는 비활성으로 둔다', () => {
    render(<TripProcessingView uploadRatio={0.5} onContinueElsewhere={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다른 작업 이어하기' })).toBeDisabled();

    expect(screen.getByRole('heading', { name: '사진을 올리고 있어요' })).toBeInTheDocument();
    expect(screen.getByText('화면을 닫지 말고 잠시만 기다려주세요.')).toBeInTheDocument();
  });

  it('업로드가 끝나고 분석 전이면 준비 문구를 보여준다', () => {
    render(<TripProcessingView uploadRatio={1} processingStatus={status(null)} />);

    expect(
      screen.getByRole('heading', { name: '사진을 살펴볼 준비를 하고 있어요' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '사진 분석을 준비하고 있어요' })).toBeInTheDocument();
  });

  it('분석 중에는 장소 찾기 문구와 살펴본 사진 수를 보여준다', () => {
    render(
      <TripProcessingView uploadRatio={1} processingStatus={status({ done: 15, total: 30 })} />,
    );

    expect(screen.getByRole('heading', { name: '사진 속 장소를 찾고 있어요' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '사진 15/30장을 살펴봤어요' })).toBeInTheDocument();
  });

  it('done이 total을 넘어도 전체 장수를 넘기지 않는다', () => {
    render(
      <TripProcessingView uploadRatio={1} processingStatus={status({ done: 33, total: 30 })} />,
    );

    expect(screen.getByRole('status', { name: '사진 30/30장을 살펴봤어요' })).toBeInTheDocument();
  });

  it('FINALIZING이면 실패가 아니라 폴더를 만드는 마무리 단계로 표시한다', () => {
    render(
      <TripProcessingView
        uploadRatio={1}
        processingStatus={{ ...status(null), status: 'FINALIZING' }}
      />,
    );

    expect(
      screen.getByRole('heading', { name: '장소별로 폴더를 만들고 있어요' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: '사진 정리를 마무리하고 있어요' }),
    ).toBeInTheDocument();
  });
});
