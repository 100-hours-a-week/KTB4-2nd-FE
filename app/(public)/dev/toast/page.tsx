import { notFound } from 'next/navigation';

import { ToastPreview } from '@/shared/ui/toast';

// TODO(임시): 공통 토스트 확인용 목 페이지입니다. 확인이 끝나면 삭제합니다.
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();

  return <ToastPreview />;
}
