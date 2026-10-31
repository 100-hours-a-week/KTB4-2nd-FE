import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { CloseIcon, StarIcon } from '@/shared/ui/icons';
import { IconButton } from './iconButton';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { 'aria-label': '닫기', children: <CloseIcon size="20" />, onClick: fn() },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Selected: Story = {
  args: {
    'aria-label': '즐겨찾기',
    'aria-pressed': true,
    children: <StarIcon size="20" fill="currentColor" />,
  },
};

export const Inverse: Story = {
  args: { tone: 'inverse', 'aria-label': '원본 보기 닫기' },
  decorators: [
    (Story) => (
      <div className="rounded-card bg-[#070c11] p-6">
        <Story />
      </div>
    ),
  ],
};
export const InverseDisabled: Story = {
  args: { tone: 'inverse', disabled: true, 'aria-label': '이전 사진' },
  decorators: [
    (Story) => (
      <div className="rounded-card bg-[#070c11] p-6">
        <Story />
      </div>
    ),
  ],
};

export const Favorite: Story = {
  args: {
    style: { backgroundColor: 'transparent' },
    'aria-label': '즐겨찾기 추가',
    'aria-pressed': false,
    children: <StarIcon size="20" stroke="#a5b0be" fill="none" />,
  },
};
export const FavoriteSelected: Story = {
  args: {
    style: { backgroundColor: 'transparent' },
    'aria-label': '즐겨찾기 해제',
    'aria-pressed': true,
    children: <StarIcon size="20" stroke="#f7b51d" fill="#f7b51d" />,
  },
};
