import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { fn } from 'storybook/test';

import { NICKNAME_MAX_LENGTH, validateNickname } from '@/features/completeSignup/model/nickname';
import {
  TRIP_CREATE_DEFAULT_VALUES,
  type TripCreateFormValues,
} from '@/features/createTrip/model/types';
import { TripNameStep } from '@/features/createTrip/ui/components/tripNameStep';
import {
  TripFormModeContext,
  type TripFormMode,
} from '@/features/createTrip/ui/components/tripFormMode';
import { WithdrawDialog } from '@/_pages/myPage/ui/components/withdrawDialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

type ExampleArgs = {
  isPending: boolean;
  onSubmit: (values: { nickname: string }) => void;
  onNext: (values: TripCreateFormValues) => void;
  onBack: () => void;
  onLogout: () => void;
  onWithdraw: () => void;
};

const screenClassName = 'mx-auto flex h-dvh max-h-[932px] w-full max-w-107.5 flex-col';

function SignupExample({ isPending, onSubmit }: ExampleArgs) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: { nickname: '' },
    mode: 'onChange',
  });
  const nickname = useWatch({ control, name: 'nickname' });
  return (
    <section className={`${screenClassName} overflow-y-auto p-6 text-brand`}>
      <h1 className="text-page-title">닉네임을 알려주세요</h1>
      <p className="text-description text-muted mt-2">
        공통 Input과 큰 제출 버튼의 조합 예시입니다. 실제 가입 요청은 전송하지 않습니다.
      </p>
      <form
        className="mt-8 flex flex-1 flex-col gap-8"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          {...register('nickname', { validate: validateNickname })}
          aria-label="닉네임"
          autoComplete="nickname"
          maxLength={NICKNAME_MAX_LENGTH}
          characterCount={nickname.length}
          helperText="2~10자의 한글, 영문, 숫자만 사용할 수 있어요."
          error={errors.nickname?.message}
        />
        <Button
          type="submit"
          size="lg"
          disabled={!isValid}
          isLoading={isPending}
          loadingText="저장 중…"
          className="mt-auto w-full"
        >
          확인
        </Button>
      </form>
    </section>
  );
}

function TripNameExample({ mode, onNext, onBack }: ExampleArgs & { mode: TripFormMode }) {
  const methods = useForm<TripCreateFormValues>({
    defaultValues: { ...TRIP_CREATE_DEFAULT_VALUES, tripName: mode === 'edit' ? '제주 여행' : '' },
  });
  return (
    <div className={screenClassName}>
      <TripFormModeContext value={mode}>
        <FormProvider {...methods}>
          <form className="h-full" onSubmit={(event) => event.preventDefault()} noValidate>
            <TripNameStep onBack={onBack} onNext={() => onNext(methods.getValues())} />
          </form>
        </FormProvider>
      </TripFormModeContext>
    </div>
  );
}

function AccountActionsExample({ isPending, onLogout, onWithdraw }: ExampleArgs) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mx-auto w-full max-w-107.5 space-y-6 p-6 text-brand">
      <header className="space-y-2">
        <h1 className="text-page-title">계정 액션</h1>
        <p className="text-description text-muted">
          로그아웃·탈퇴 버튼과 실제 탈퇴 Dialog의 조합입니다. 실제 계정 요청은 전송하지 않습니다.
        </p>
      </header>
      <Button variant="secondary" isLoading={isPending} onClick={onLogout} className="w-full">
        로그아웃
      </Button>
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          탈퇴하기
        </Button>
      </div>
      <WithdrawDialog
        open={open}
        isWithdrawing={isPending}
        onClose={() => setOpen(false)}
        onConfirm={onWithdraw}
      />
    </section>
  );
}

const meta = {
  title: 'Patterns/Forms',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    isPending: false,
    onSubmit: fn(),
    onNext: fn(),
    onBack: fn(),
    onLogout: fn(),
    onWithdraw: fn(),
  },
  argTypes: {
    isPending: { control: 'boolean', description: '저장·계정 요청 진행 상태의 UI 예시' },
  },
} satisfies Meta<ExampleArgs>;

export default meta;
type Story = StoryObj<ExampleArgs>;

export const Signup: Story = {
  name: '회원가입 입력 조합',
  render: (args) => <SignupExample {...args} />,
};
export const CreateTrip: Story = {
  name: '여행 생성 · 이름 단계',
  render: (args) => <TripNameExample {...args} mode="create" />,
  argTypes: { isPending: { control: false } },
};
export const EditTrip: Story = {
  name: '여행 수정 · 이름 단계',
  render: (args) => <TripNameExample {...args} mode="edit" />,
  argTypes: { isPending: { control: false } },
};
export const AccountActions: Story = {
  name: '계정 액션',
  render: (args) => <AccountActionsExample {...args} />,
};
