import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect } from 'react';

import { Button } from '@/shared/ui/button';

import { toast, type ToastVariant } from './toastStore';
import { ToastViewport } from './toastViewport';

type ExampleArgs = { message: string; variant: ToastVariant; duration: number };

function ToastExample({ message, variant, duration }: ExampleArgs) {
  useEffect(() => {
    toast.show(message, { variant, duration });
    return () => toast.dismiss();
  }, [message, variant, duration]);
  return (
    <div className="mx-auto min-h-56 w-full max-w-[430px] px-6 pt-32 pb-6">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => toast.show(message, { variant, duration })}
      >
        알림 다시 띄우기
      </Button>
      <ToastViewport />
    </div>
  );
}

const meta = {
  title: 'Components/Toast',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '실제 전역 토스트를 사용합니다. 닫기 버튼과 위로 밀기, 자동 사라짐을 확인할 수 있습니다. 스토리를 나가면 샘플 알림을 정리합니다.',
      },
    },
  },
  args: { message: '사진을 저장했어요.', variant: 'success', duration: 0 },
  argTypes: {
    variant: { control: 'select', options: ['success', 'error', 'info', 'warning'] },
    duration: { control: { type: 'number', min: 0, step: 1000 } },
  },
  render: (args) => <ToastExample {...args} />,
} satisfies Meta<ExampleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = { name: '성공 · 직접 닫기' };
export const Error: Story = {
  name: '오류',
  args: { variant: 'error', message: '사진을 저장하지 못했어요.' },
};
export const Info: Story = {
  name: '안내',
  args: { variant: 'info', message: '선택한 사진을 확인해주세요.' },
};
export const Warning: Story = {
  name: '주의',
  args: { variant: 'warning', message: '폴더는 최대 10개까지 선택할 수 있어요.' },
};
export const LongMessage: Story = {
  name: '긴 메시지',
  args: {
    message: '선택한 사진 중 일부를 저장하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해주세요.',
  },
};
export const AutoDismiss: Story = { name: '3초 후 자동 닫기', args: { duration: 3000 } };
