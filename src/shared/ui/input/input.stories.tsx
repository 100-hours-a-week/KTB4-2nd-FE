import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { Input } from '@/shared/ui/input';

const meta = {
  title: 'Components/Input',
  component: Input,
  decorators: [
    (Story) => (
      <div className="w-[min(320px,calc(100vw-48px))]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '라벨, 안내 또는 오류 문구를 표시하는 입력창입니다. 오류는 안내 문구보다 우선합니다.',
      },
    },
  },
  args: { label: '여행 이름', placeholder: '여행 이름을 입력해주세요', onChange: fn() },
  argTypes: {
    variant: { control: 'select', options: ['underline', 'boxed'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Boxed: Story = { args: { variant: 'boxed' } };
export const WithHelperText: Story = { args: { helperText: '기억하기 쉬운 이름을 지어주세요.' } };
export const WithError: Story = {
  args: {
    error: '여행 이름을 입력해주세요.',
    helperText: '오류가 있으면 안내 대신 오류를 표시합니다.',
  },
};
export const Disabled: Story = { args: { disabled: true, defaultValue: '제주 여행' } };
export const ReadOnly: Story = { args: { readOnly: true, value: '제주 여행' } };
export const CharacterCount: Story = {
  args: { value: '', maxLength: 20, helperText: '20자 이내로 입력해주세요.' },
  render: function CharacterCountStory(args) {
    const [, updateArgs] = useArgs();
    return (
      <Input
        {...args}
        onChange={(event) => {
          args.onChange?.(event);
          updateArgs({ value: event.target.value });
        }}
      />
    );
  },
};
