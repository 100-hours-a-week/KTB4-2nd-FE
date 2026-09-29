'use client';

import { useRouter } from 'next/navigation';

import { PageHeader } from '@/shared/ui/pageHeader';

export function LegalBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  };

  return (
    <PageHeader
      backLabel="이전 페이지로 이동"
      onBack={handleBack}
      className="-mx-2 h-16"
    />
  );
}
