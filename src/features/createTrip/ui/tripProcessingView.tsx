'use client';

import { useContext, useState, type ComponentType } from 'react';

import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { MapIcon, PinIcon, SearchIcon, UploadIcon, type IconProps } from '@/shared/ui/icons';
import { PageHeader } from '@/shared/ui/pageHeader';

import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';
import { tripCreateButtonClassName } from './tripCreateStepLayout';
import { TripFormModeContext } from './tripFormMode';

type TripProcessingViewProps = {
  uploadRatio: number;
  processingStatus?: TripProcessingStatusResponse;
  onCancel?: () => void;
  isCanceling?: boolean;
  onContinueElsewhere?: () => void;
};

type ProcessingStage = 'upload' | 'preparing' | 'analysis' | 'finalizing';

type StageCopy = {
  Icon: ComponentType<IconProps>;
  title: [string, string];
  detail: string;
};

const STAGE_COPY: Record<ProcessingStage, StageCopy> = {
  upload: {
    Icon: UploadIcon,
    title: ['사진을', '올리고 있어요'],
    detail: '사진을 안전하게 보내고 있어요',
  },
  preparing: {
    Icon: SearchIcon,
    title: ['사진을 살펴볼', '준비를 하고 있어요'],
    detail: '사진 분석을 준비하고 있어요',
  },
  analysis: {
    Icon: PinIcon,
    title: ['사진 속 장소를', '찾고 있어요'],
    detail: '사진마다 찍은 장소를 확인하고 있어요',
  },
  finalizing: {
    Icon: MapIcon,
    title: ['장소별로 폴더를', '만들고 있어요'],
    detail: '사진 정리를 마무리하고 있어요',
  },
};

function getStage({ uploadRatio, processingStatus }: TripProcessingViewProps): ProcessingStage {
  if (processingStatus?.status === 'FINALIZING') return 'finalizing';
  if (processingStatus?.progress && processingStatus.progress.total > 0) return 'analysis';
  if (uploadRatio < 1) return 'upload';
  return 'preparing';
}

function getDetail(stage: ProcessingStage, processingStatus?: TripProcessingStatusResponse) {
  const analysis = processingStatus?.progress;
  if (stage === 'analysis' && analysis) {
    const done = Math.min(Math.max(analysis.done, 0), analysis.total);
    return `사진 ${done}/${analysis.total}장을 살펴봤어요`;
  }
  return STAGE_COPY[stage].detail;
}

export function TripProcessingView(props: TripProcessingViewProps) {
  const stage = getStage(props);
  const { Icon, title } = STAGE_COPY[stage];
  const detail = getDetail(stage, props.processingStatus);
  const { onCancel, isCanceling = false, onContinueElsewhere } = props;
  const mode = useContext(TripFormModeContext);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const canLeave = stage !== 'upload';

  return (
    <main className="bg-surface text-foreground mx-auto flex h-full min-h-0 w-full max-w-107.5 flex-col overflow-hidden px-6 pt-[max(8px,env(safe-area-inset-top))]">
      <PageHeader
        title={mode === 'edit' ? '여행 수정' : '여행 만들기'}
        backLabel="이전 단계로 이동"
        onBack={() => onContinueElsewhere?.()}
        backDisabled={!canLeave}
      />

      <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div role="status" aria-label={detail} className="relative size-[154px] shrink-0">
          <svg
            aria-hidden="true"
            viewBox="0 0 160 160"
            className="absolute inset-0 size-full -rotate-90"
          >
            <circle cx="80" cy="80" r="72" fill="none" stroke="#edf1f6" strokeWidth="6" />
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="#021730"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="120 453"
              className="origin-center animate-spin motion-reduce:animate-none"
            />
          </svg>
          <span className="text-brand absolute inset-0 grid place-items-center">
            <Icon size={52} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          </span>
        </div>

        <h2 className="text-brand mt-9 text-[22px] leading-[1.4] font-extrabold tracking-[-0.04em]">
          {title[0]} <br />
          {title[1]}
        </h2>
        <p className="text-muted mt-2 text-[15px] tabular-nums" aria-live="polite">
          {detail}
        </p>
      </section>

      {/* 다른 단계 화면의 하단 버튼과 같은 위치에 둡니다. 업로드 중에는 나가거나 취소할 수 없으므로 비활성으로 보여줍니다. */}
      <footer className="shrink-0 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] text-center">
        <p className="text-muted mb-3 text-sm">
          {canLeave
            ? '폴더가 완성되는 동안 다른 작업을 할 수 있어요.'
            : '화면을 닫지 말고 잠시만 기다려주세요.'}
        </p>
        {onContinueElsewhere && (
          <Button
            onClick={onContinueElsewhere}
            disabled={!canLeave}
            className={`w-full ${tripCreateButtonClassName}`}
          >
            다른 작업 이어하기
          </Button>
        )}
        {/* 만들기 화면에서만 생성을 취소할 수 있습니다. 뒤로가기는 취소하지 않고 화면만 나갑니다. */}
        {onCancel && (
          <Button
            variant="ghost"
            onClick={() => setCancelDialogOpen(true)}
            disabled={!canLeave || isCanceling}
            className="mt-2 min-h-10 w-full text-sm font-medium"
          >
            {isCanceling ? '취소하는 중...' : '여행 생성 취소하기'}
          </Button>
        )}
      </footer>

      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="아직 폴더를 생성 중입니다."
        description="여행 생성을 취소하면 사진 업로드 페이지로 돌아가요."
        size="wide"
      >
        <div className="space-y-2">
          <Button onClick={() => setCancelDialogOpen(false)} className="w-full">
            이어서 만들기
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCancelDialogOpen(false);
              onCancel?.();
            }}
            className="w-full"
          >
            취소하기
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
