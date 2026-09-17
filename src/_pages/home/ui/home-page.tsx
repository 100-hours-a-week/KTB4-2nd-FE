'use client';

import { useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottom-navigation';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { DropdownMenu } from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { toast } from '@/shared/ui/toast';
import { Toggle } from '@/shared/ui/toggle';

type ShowcaseForm = {
  title: string;
  destination: string;
  notifications: boolean;
};

const destinationOptions = [
  { value: 'jeju', label: '제주도' },
  { value: 'busan', label: '부산' },
  { value: 'gangneung', label: '강릉' },
] as const;

const navigationItems: BottomNavigationItem[] = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'list', label: '목록', icon: 'list' },
  { id: 'create', label: '새 기록 추가', icon: 'plus', action: true },
  { id: 'search', label: '검색', icon: 'search' },
  { id: 'profile', label: '마이페이지', icon: 'profile' },
];

export function HomePage() {
  const { control, register } = useForm<ShowcaseForm>({
    defaultValues: {
      title: '',
      destination: '',
      notifications: true,
    },
  });
  const title = useWatch({ control, name: 'title' });
  const [selectedDate, setSelectedDate] = useState('');
  const [activeNavigation, setActiveNavigation] = useState('home');

  return (
    <main className="bg-app-background min-h-screen px-4 pt-8 pb-28 text-foreground">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-8">
        <header>
          <p className="text-muted text-sm font-semibold">YEODAM UI</p>
          <h1 className="text-brand mt-1 text-3xl font-extrabold">여담</h1>
          <p className="text-brand mt-2 font-semibold">공통 컴포넌트</p>
          <p className="text-muted mt-1 text-sm">
            현재 구현된 UI와 동작을 임시로 확인하는 화면입니다.
          </p>
          <p className="text-muted mt-1 text-xs">하단 메뉴는 선택 상태만 바뀌는 미리보기입니다.</p>
        </header>

        <ShowcaseSection title="Button">
          <div className="flex flex-col gap-3">
            <Button className="w-full">기본 버튼</Button>
            <Button className="w-full" isLoading>
              저장하기
            </Button>
            <Button className="w-full" disabled>
              비활성 버튼
            </Button>
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Input">
          <Input
            {...register('title')}
            label="여행 제목"
            placeholder="여행 제목을 입력해주세요."
            helperText="최대 20자까지 입력할 수 있어요."
            maxLength={20}
            characterCount={title.length}
          />
        </ShowcaseSection>

        <ShowcaseSection title="Select">
          <Select
            {...register('destination')}
            label="여행지"
            placeholder="여행지를 선택해주세요."
            helperText="기록할 여행지를 선택하세요."
            options={destinationOptions}
          />
        </ShowcaseSection>

        <ShowcaseSection title="Toggle">
          <Toggle
            {...register('notifications')}
            label="여행 알림"
            description="새로운 여행 소식을 알림으로 받아볼게요."
          />
        </ShowcaseSection>

        <ShowcaseSection title="Calendar">
          <Calendar value={selectedDate} initialMonth="2026-09-01" onChange={setSelectedDate} />
          <p className="text-muted mt-3 text-sm">
            선택한 날짜: {selectedDate || '날짜를 선택해주세요.'}
          </p>
        </ShowcaseSection>

        <ShowcaseSection title="Dropdown Menu">
          <div className="flex items-center justify-between">
            <p className="text-brand text-sm font-medium">여행 기록 관리</p>
            <DropdownMenu
              items={[
                {
                  id: 'edit',
                  label: '수정하기',
                  onSelect: () => toast.info('수정하기를 선택했어요.'),
                },
                {
                  id: 'share',
                  label: '공유하기',
                  onSelect: () => toast.success('공유하기를 선택했어요.'),
                },
                {
                  id: 'delete',
                  label: '삭제하기',
                  destructive: true,
                  dividerBefore: true,
                  onSelect: () => toast.error('삭제하기를 선택했어요.'),
                },
              ]}
            />
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Toast">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => toast.success('저장되었습니다.')}>성공</Button>
            <Button onClick={() => toast.error('잠시 후 다시 시도해주세요.')}>오류</Button>
            <Button onClick={() => toast.info('새로운 알림이 있어요.')}>안내</Button>
            <Button onClick={() => toast.warning('입력 내용을 확인해주세요.')}>주의</Button>
          </div>
        </ShowcaseSection>
      </div>
      <BottomNavigation
        items={navigationItems}
        activeId={activeNavigation}
        onSelect={(id) => {
          if (id === 'create') {
            toast.info('새 기록 추가 버튼을 선택했어요.');
            return;
          }
          setActiveNavigation(id);
        }}
      />
    </main>
  );
}

function ShowcaseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-control bg-surface border border-slate-200 p-5 shadow-sm">
      <h2 className="text-brand mb-5 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
