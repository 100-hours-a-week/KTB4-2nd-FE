import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { IconButton } from '@/shared/ui/iconButton';
import { EditIcon } from '@/shared/ui/icons';

import { PageHeader, type PageHeaderProps } from './pageHeader';

const meta = {
  title: 'Components/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '뒤로가기 링크 또는 버튼, 제목, 우측 액션을 배치합니다. 링크는 href 이동, 버튼은 전달받은 콜백을 실행합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-[430px] p-6">
        <Story />
      </div>
    ),
  ],
  args: { title: '제주도 가을 여행', backLabel: '이전 화면으로 돌아가기', onBack: fn() },
  argTypes: {
    title: { control: 'text' },
    backDisabled: { control: 'boolean' },
    action: { control: false },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<Extract<PageHeaderProps, { onBack: () => void }>>;

export const Default: Story = { name: '뒤로가기 버튼' };
export const LinkNavigation: Story = {
  name: '뒤로가기 링크',
  render: ({ title, backLabel }) => (
    <PageHeader title={title} backLabel={backLabel} backHref="/trips" />
  ),
};
export const Disabled: Story = { name: '이전 단계 이동 비활성', args: { backDisabled: true } };
export const WithAction: Story = {
  name: '우측 액션',
  args: {
    action: (
      <IconButton aria-label="여행 편집" onClick={fn()}>
        <EditIcon aria-hidden="true" size="20" />
      </IconButton>
    ),
  },
};
export const LongTitle: Story = {
  name: '긴 제목',
  args: { title: '가족과 함께 떠난 아주 길고 즐거웠던 제주도 가을 여행 기록' },
};
export const WithoutTitle: Story = { name: '제목 없이 뒤로가기만', args: { title: undefined } };
