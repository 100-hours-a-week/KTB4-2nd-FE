import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';

type TripProcessingViewProps = {
  uploadRatio: number;
  processingStatus?: TripProcessingStatusResponse;
};

type ProcessingStage = 'upload' | 'preparing' | 'analysis';

const UPLOAD_PERCENT = 30;

function clampRatio(ratio: number) {
  return Math.min(Math.max(ratio, 0), 1);
}

function getProgress({ uploadRatio, processingStatus }: TripProcessingViewProps): {
  stage: ProcessingStage;
  detail: string;
  percent: number;
} {
  const analysis = processingStatus?.progress;

  if (analysis && analysis.total > 0) {
    const analysisRatio = clampRatio(analysis.done / analysis.total);

    return {
      stage: 'analysis',
      detail: `사진 ${analysis.done}/${analysis.total}장을 분석하고 있어요`,
      percent: UPLOAD_PERCENT + Math.floor(analysisRatio * (100 - UPLOAD_PERCENT)),
    };
  }

  if (uploadRatio < 1) {
    return {
      stage: 'upload',
      detail: '사진을 올리고 있어요',
      percent: Math.floor(clampRatio(uploadRatio) * UPLOAD_PERCENT),
    };
  }

  return {
    stage: 'preparing',
    detail: '사진 분석을 준비하고 있어요',
    percent: UPLOAD_PERCENT,
  };
}

export function TripProcessingView(props: TripProcessingViewProps) {
  const { stage, detail, percent } = getProgress(props);

  return (
    <main className="bg-surface text-foreground mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-5 text-center">
      <h1 className="text-brand text-2xl leading-snug font-extrabold">
        사진을 장소별로
        <br />
        정리하고 있어요
      </h1>
      <p className="text-muted mt-2 text-sm">화면을 닫지 말고 잠시만 기다려주세요.</p>

      <div className="mt-10 w-full">
        <p className="text-brand text-[44px] leading-none font-extrabold tabular-nums">
          {percent}%
        </p>
        <div
          role="progressbar"
          aria-label={detail}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={`bg-brand h-full rounded-full transition-[width] duration-500 ${stage === 'preparing' ? 'animate-pulse' : ''}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-muted mt-3 text-sm" aria-live="polite">
          {detail}
        </p>
      </div>
    </main>
  );
}
