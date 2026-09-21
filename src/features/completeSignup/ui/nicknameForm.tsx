'use client';

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';

import { completeSignupQueries } from '@/queryFactory';
import type { ApiErrorResponse } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { toast } from '@/shared/ui/toast';

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

  const router = useRouter();
  const nickname = useWatch({ control, name: 'nickname' });
  const signupMutation = useMutation({
    ...completeSignupQueries.complete(),
    onSuccess: () => {
      toast.success('닉네임이 저장되었어요.');
      router.replace('/');
    },
    onError: (error) => {
      const code = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message
        : undefined;

      switch (code) {
        case 'INVALID_NICKNAME':
          toast.error('사용할 수 없는 닉네임이에요.');
          return;
        // profileToken이 없거나 만료되면 카카오 로그인부터 다시 진행해야 합니다.
        case 'ONBOARDING_TOKEN_INVALID_OR_EXPIRED':
          toast.error('가입 시간이 만료되었어요. 다시 로그인해주세요.');
          router.replace('/login');
          return;
        // 이미 가입을 마친 로그인 상태이므로 홈으로 보냅니다.
        case 'ONBOARDING_TOKEN_REQUIRED':
          router.replace('/');
          return;
        default:
          toast.error('잠시 후 다시 시도해주세요.');
      }
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
