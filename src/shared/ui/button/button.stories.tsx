import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { Button } from '@/shared/ui/button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: '일반 액션과 폼 제출에 사용합니다. 로딩 중에는 클릭이 비활성화됩니다.',
      },
    },
  },
  args: { children: '확인', size: 'md', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'destructive', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    children: { control: 'text' },
    disabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    loadingText: { control: 'text' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: '취소' } };
export const Destructive: Story = { args: { variant: 'destructive', children: '삭제하기' } };
export const Ghost: Story = { args: { variant: 'ghost', children: '나중에' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { isLoading: true } };
export const CustomLoadingText: Story = { args: { isLoading: true, loadingText: '저장 중…' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} size="sm">
        작은 버튼
      </Button>
      <Button {...args} size="md">
        기본 버튼
      </Button>
      <Button {...args} size="lg">
        큰 버튼
      </Button>
    </div>
  ),
};
export const LongLabel: Story = {
  args: { children: '선택한 사진을 여행에 추가하고 계속 진행하기', className: 'w-48' },
};
