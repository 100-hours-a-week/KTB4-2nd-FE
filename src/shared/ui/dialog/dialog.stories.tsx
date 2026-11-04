import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { WarningIcon } from '@/shared/ui/icons';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    docs: {
      story: { inline: false, height: '440px' },
      description: {
        component:
          '확인 또는 주의가 필요한 상황에 사용합니다. 배경 클릭과 Escape로 닫을 수 있으며 닫은 뒤 열기 버튼으로 포커스가 돌아갑니다.',
      },
    },
  },
  args: {
    open: false,
    title: '여행을 기록해보세요',
    onClose: fn(),
    children: '여행 사진을 모아 이야기를 만들 수 있어요.',
  },
  argTypes: {
    size: { control: 'select', options: ['default', 'wide'] },
    open: { control: 'boolean' },
    destructive: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    icon: { control: false },
    children: { control: false },
  },
  render: function InteractiveDialog(args) {
    const [, updateArgs] = useArgs();
    function close() {
      args.onClose();
      updateArgs({ open: false });
    }
    return (
      <>
        <Button onClick={() => updateArgs({ open: true })}>다이얼로그 열기</Button>
        <Dialog {...args} onClose={close}>
          <div className="text-description text-muted mb-5">{args.children}</div>
          {args.destructive ? (
            <DialogActions>
              <Button variant="secondary" onClick={close}>
                취소
              </Button>
              <Button variant="destructive" onClick={close}>
                삭제하기
              </Button>
            </DialogActions>
          ) : (
            <Button className="w-full" onClick={close}>
              확인
            </Button>
          )}
        </Dialog>
      </>
    );
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithDescriptionAndIcon: Story = {
  args: {
    title: '사진 위치를 확인해주세요',
    description: '위치 정보가 없는 사진이 포함되어 있어요.',
    icon: <WarningIcon size="24" />,
    children: '위치를 직접 지정하면 여행에 함께 정리할 수 있어요.',
  },
};
export const Destructive: Story = {
  args: {
    destructive: true,
    title: '여행을 삭제하시겠습니까?',
    description: '삭제 후에는 되돌릴 수 없습니다.',
    children: '여행과 포함된 사진이 함께 삭제됩니다.',
  },
};
export const Wide: Story = {
  args: {
    size: 'wide',
    title: '공유 전에 확인해주세요',
    children: '여행에 포함된 사진과 이야기가 공유됩니다. 공개할 내용을 확인한 뒤 진행해주세요.',
  },
};

export const LongContent: Story = {
  args: {
    size: 'wide',
    title: '여행에 포함된 사진과 이야기를 확인해주세요',
    description: '내용이 길면 패널 내부에서 스크롤할 수 있습니다.',
    children: '여행 사진과 이야기가 함께 공유됩니다. 공개할 내용을 확인한 뒤 진행해주세요. '.repeat(
      30,
    ),
  },
};
