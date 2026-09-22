import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';

type TripProcessingViewProps = {
  uploadRatio: number;
  processingStatus?: TripProcessingStatusResponse;
};

function getProgress({ uploadRatio, processingStatus }: TripProcessingViewProps) {
  const analysis = processingStatus?.progress;

  if (analysis && analysis.total > 0) {
    return {
      label: `사진 ${analysis.done}/${analysis.total}장을 분석하고 있어요`,
      ratio: analysis.done / analysis.total,
    };
  }

  if (uploadRatio < 1) {
    return { label: `사진을 올리고 있어요 ${Math.floor(uploadRatio * 100)}%`, ratio: uploadRatio };
  }

  return { label: '사진 분석을 준비하고 있어요', ratio: null };
}

export function TripProcessingView(props: TripProcessingViewProps) {
  const { label, ratio } = getProgress(props);

  return (
    <main className="bg-surface text-foreground mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-5 text-center">
      <h1 className="text-brand text-2xl leading-snug font-extrabold">
        사진을 장소별로
        <br />
        정리하고 있어요
      </h1>
      <p className="text-muted mt-2 text-sm">화면을 닫지 말고 잠시만 기다려주세요.</p>

      <div className="mt-10 w-full" aria-live="polite">
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ratio === null ? undefined : Math.floor(ratio * 100)}
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={`bg-brand h-full rounded-full transition-[width] duration-500 ${ratio === null ? 'w-1/3 animate-pulse' : ''}`}
            style={ratio === null ? undefined : { width: `${ratio * 100}%` }}
          />
        </div>
        <p className="text-muted mt-3 text-sm">{label}</p>
      </div>
    </main>
  );
}
