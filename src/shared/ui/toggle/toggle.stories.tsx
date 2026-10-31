import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Toggle } from './toggle';

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  args: { label: '알림 받기', onChange: fn() },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const FavoriteFilter: Story = {
  args: { size: 'sm', label: '즐겨찾기만', 'aria-label': '즐겨찾기만 보기' },
};
