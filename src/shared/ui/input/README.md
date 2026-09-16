# Input

밑줄형 텍스트 입력창. 오른쪽 글자 수와 하단 안내·오류 문구를 표시한다.
오류가 있으면 안내 문구 대신 빨간 경고 아이콘과 오류 문구가 표시된다.

## React Hook Form 연결

`register`의 `ref`, `name`, `onChange`, `onBlur`를 실제 input에 전달한다.
입력값을 내부 state에 복제하지 않는다. 글자 수는 `useWatch` 값에서 계산해 전달하므로
`reset()`과 `setValue()`로 변경한 값도 반영된다.

```tsx
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { Input } from '@/shared/ui/input';

type FormValues = { nickname: string };

export function NicknameForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { nickname: '' },
    mode: 'onBlur',
  });
  const nickname = useWatch({ control, name: 'nickname' });

  return (
    <form noValidate onSubmit={handleSubmit((values) => console.log(values))}>
      <Input
        {...register('nickname', {
          required: '닉네임을 입력해주세요.',
          maxLength: { value: 10, message: '10자 이하로 입력해주세요.' },
        })}
        label="닉네임"
        placeholder="닉네임을 입력해주세요"
        maxLength={10}
        characterCount={nickname.length}
        error={errors.nickname?.message}
      />
      <button type="submit">확인</button>
    </form>
  );
}
```

- `maxLength`와 `characterCount`를 함께 전달하면 `0/10` 형태로 표시한다.
- 제어형 input은 `value`를 전달하면 글자 수를 자동 계산한다.
- `maxLength`만 전달한 비제어형 input은 입력 길이만 제한하고 글자 수는 표시하지 않는다.
- `helperText`는 일반 안내, `error`는 검증 오류 문구다. 오류의 `*`와 아이콘은 자동 표시한다.
- `label`을 생략하면 `aria-label` 또는 외부 label로 입력창 이름을 제공한다.
- `className`은 실제 input에 적용된다. `disabled`, `readOnly`, `required` 등 기본 속성도 지원한다.
- 예시의 10자는 사용 화면에서 정하는 값이다. 컴포넌트에 닉네임 길이 규칙을 고정하지 않는다.
- 글자 수는 네이티브 `maxLength`와 동일한 UTF-16 단위(`string.length`)다.
