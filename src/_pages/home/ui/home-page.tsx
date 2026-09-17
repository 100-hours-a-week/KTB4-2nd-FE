'use client';

import { Input } from '@/shared/ui/input';
import { useForm, useWatch } from 'react-hook-form';

export function HomePage() {
  const { register, control } = useForm({
    defaultValues: {
      title: '',
    },
  });

  const title = useWatch({
    control,
    name: 'title',
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">여담</h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400"></p>
        <div className="w-[500px]">
          <Input
            {...register('title')}
            helperText="도움말 텍스트"
            maxLength={20}
            characterCount={(title.length, 20)}
          />
        </div>
      </section>
    </main>
  );
}
