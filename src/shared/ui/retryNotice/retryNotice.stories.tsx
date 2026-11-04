import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { WarningIcon } from '@/shared/ui/icons';

import { RetryNotice } from './retryNotice';

const meta = {
  title: 'Components/RetryNotice',
  component: RetryNotice,
  parameters: {
    docs: {
      description: {
        component:
          '조회 실패 메시지와 재시도 버튼을 표시합니다. 화면에서 위치를 지정하고 onRetry에 기존 재조회 함수를 연결합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[390px]">
        <Story />
      </div>
    ),
  ],
  args: { message: '사진을 가져오지 못했어요.', onRetry: fn(), isRetrying: false },
  argTypes: { message: { control: 'text' }, icon: { control: false } },
} satisfies Meta<typeof RetryNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithIcon: Story = { args: { icon: <WarningIcon stroke="#ffb1a9" size="18" /> } };
export const Retrying: Story = { name: '재시도 중', args: { isRetrying: true } };
export const LongMessage: Story = {
  name: '긴 오류 안내',
  args: {
    message: '검색 결과를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 잠시 후 다시 시도해주세요.',
  },
};
export const WithoutRetry: Story = { name: '안내만 표시', args: { onRetry: undefined } };
