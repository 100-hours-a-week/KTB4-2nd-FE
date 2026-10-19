'use client';

import { toast } from './toastStore';

// TODO(임시): 공통 토스트 확인용 목 화면입니다. /dev/toast 페이지와 함께 삭제합니다.

const MOCK_TOASTS = [
  { label: '성공', show: () => toast.success('여행을 만들었어요. 장소별로 사진을 정리했어요.') },
  {
    label: '오류',
    show: () => toast.error('사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.'),
  },
  { label: '안내', show: () => toast.info('여행을 수정하고 있어요. 끝나면 다시 열어주세요.') },
  { label: '경고', show: () => toast.warning('사진 정리를 취소했어요.') },
  {
    label: '긴 문구',
    show: () =>
      toast.info(
        '여행 스토리가 완성됐어요. 여행 상세에서 확인해 보세요. 문구가 길어지면 두 줄 이상으로 늘어나요.',
      ),
  },
];

export function ToastPreview() {
  const showMany = () => {
    MOCK_TOASTS.slice(0, 3).forEach((mock, index) => window.setTimeout(mock.show, index * 400));
  };

  return (
    <main className="bg-surface mx-auto flex h-full w-full max-w-107.5 flex-col justify-center gap-2 px-6">
      <h1 className="text-brand mb-2 text-lg font-extrabold">토스트 미리보기</h1>
      {MOCK_TOASTS.map((mock) => (
        <button
          key={mock.label}
          type="button"
          onClick={mock.show}
          className="rounded-control border border-slate-200 px-4 py-3 text-left text-sm font-semibold"
        >
          {mock.label} 토스트 띄우기
        </button>
      ))}
      <button
        type="button"
        onClick={showMany}
        className="rounded-control bg-brand px-4 py-3 text-left text-sm font-semibold text-white"
      >
        3개 연달아 띄우기
      </button>
    </main>
  );
}
