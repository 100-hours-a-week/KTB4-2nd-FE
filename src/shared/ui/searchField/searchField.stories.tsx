import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { SearchField, type SearchFieldProps } from './searchField';

function InteractiveSearch(args: SearchFieldProps) {
  const [value, setValue] = useState(args.value);
  return (
    <SearchField
      {...args}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        args.onValueChange(next);
      }}
    />
  );
}

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  decorators: [
    (Story) => (
      <div className="w-[min(360px,calc(100vw-48px))]">
        <Story />
      </div>
    ),
  ],
  args: { label: '검색어', placeholder: '검색어를 입력해주세요', value: '', onValueChange: fn() },
  render: (args) => <InteractiveSearch {...args} />,
  argTypes: { value: { control: false }, onValueChange: { control: false } },
} satisfies Meta<typeof SearchField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithValue: Story = { args: { value: '제주 여행' } };
export const WithIcon: Story = {
  args: { label: '여행지 검색', showSearchIcon: true, placeholder: '시/군 이름으로 검색해주세요' },
};
export const Error: Story = { args: { value: '제', error: '검색어를 2글자 이상 입력해주세요.' } };
export const Disabled: Story = { args: { value: '제주 여행', disabled: true } };
