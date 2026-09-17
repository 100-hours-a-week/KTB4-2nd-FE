'use client';

import { useMutation } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { toast } from '@/shared/ui/toast';

import { completeSignupQueryFactory } from '../api/query-factory';
import { NICKNAME_MAX_LENGTH, validateNickname } from '../model/nickname';

type SignupFormValues = {
  nickname: string;
};

export function NicknameForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignupFormValues>({
    defaultValues: { nickname: '' },
    mode: 'onChange',
  });

  const nickname = useWatch({ control, name: 'nickname' });
  const signupMutation = useMutation({
    ...completeSignupQueryFactory.complete(),
    onSuccess: () => {
      toast.success('닉네임이 저장되었어요.');
    },
    onError: () => {
      toast.error('잠시 후 다시 시도해주세요.');
    },
  });

  const onSubmit = handleSubmit((values) => {
    signupMutation.mutate(values);
  });

  return (
    <form className="mt-10 flex flex-1 flex-col" noValidate onSubmit={onSubmit}>
      <Input
        {...register('nickname', { validate: validateNickname })}
        aria-label="닉네임"
        autoComplete="nickname"
        autoFocus
        maxLength={NICKNAME_MAX_LENGTH}
        characterCount={Math.min(nickname.length, NICKNAME_MAX_LENGTH)}
        helperText="2~10자의 한글, 영문, 숫자만 사용할 수 있어요."
        error={errors.nickname?.message}
      />

      <Button
        type="submit"
        disabled={!isValid}
        isLoading={signupMutation.isPending}
        loadingText="저장 중…"
        className="mt-auto min-h-14 w-full text-lg"
      >
        확인
      </Button>
    </form>
  );
}
