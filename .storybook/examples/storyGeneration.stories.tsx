import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { StoryCancelDialog } from '@/_pages/storyCreate/ui/components/storyCancelDialog';
import { StoryGenerationView } from '@/_pages/storyCreate/ui/components/storyGenerationView';

type ExampleArgs = {
  status: 'processing' | 'completed' | 'failed';
  elapsed: number;
  isRetrying: boolean;
  cancelOpen: boolean;
  canCancel: boolean;
  isCanceling: boolean;
  onBack: () => void;
  onContinueElsewhere: () => void;
  onView: () => void;
  onRetry: () => void;
  onCancel: () => void;
};

function StoryGenerationExample(args: ExampleArgs) {
  const [cancelOpen, setCancelOpen] = useState(args.cancelOpen);
  return (
    <section className="text-brand bg-surface mx-auto flex h-dvh max-h-[932px] w-full max-w-[430px] flex-col overflow-hidden px-6 pt-[max(8px,env(safe-area-inset-top))]">
      <StoryGenerationView
        nickname="여담"
        status={args.status}
        elapsed={args.elapsed}
        message="사진에 어울리는 이야기를 정리하고 있어요."
        isRetrying={args.isRetrying}
        onBack={() => (args.status === 'processing' ? setCancelOpen(true) : args.onBack())}
        onContinueElsewhere={args.onContinueElsewhere}
        onView={args.onView}
        onRetry={args.onRetry}
      />
      <StoryCancelDialog
        open={cancelOpen && args.status === 'processing'}
        canCancel={args.canCancel}
        isCanceling={args.isCanceling}
        onConfirm={args.onCancel}
        onClose={() => setCancelOpen(false)}
      />
    </section>
  );
}

const meta = {
  title: 'Patterns/StoryGeneration',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '실제 생성 로딩·완료·실패 화면과 취소 확인창입니다. 생성 중에는 로딩 애니메이션을 표시하고 콜백은 Actions에만 기록합니다. 생성·폴링·취소 API는 호출하지 않습니다.',
      },
    },
  },
  args: {
    status: 'processing',
    elapsed: 20,
    isRetrying: false,
    cancelOpen: false,
    canCancel: true,
    isCanceling: false,
    onBack: fn(),
    onContinueElsewhere: fn(),
    onView: fn(),
    onRetry: fn(),
    onCancel: fn(),
  },
  argTypes: {
    status: { control: 'select', options: ['processing', 'completed', 'failed'] },
  },
  render: (args) => (
    <StoryGenerationExample
      key={`${args.status}:${args.cancelOpen}:${args.isCanceling}`}
      {...args}
    />
  ),
} satisfies Meta<ExampleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Processing: Story = { name: '생성 중' };
export const Delayed: Story = {
  name: '생성 지연 안내',
  args: { elapsed: 90 },
};
export const Completed: Story = {
  name: '생성 완료',
  args: { status: 'completed' },
};
export const Failed: Story = { name: '생성 실패', args: { status: 'failed' } };
export const Retrying: Story = {
  name: '다시 시도 준비 중',
  args: { status: 'failed', isRetrying: true },
};
export const CancelConfirm: Story = { name: '취소 확인', args: { cancelOpen: true } };
export const CancelUnavailable: Story = {
  name: '생성 접수 중 · 취소 대기',
  args: { cancelOpen: true, canCancel: false },
};
export const Canceling: Story = {
  name: '취소 요청 중',
  args: { cancelOpen: true, isCanceling: true },
};
