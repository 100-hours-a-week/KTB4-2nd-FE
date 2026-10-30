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
