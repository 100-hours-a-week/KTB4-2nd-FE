import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { StoryCreateActions } from '@/_pages/storyCreate/ui/components/storyCreateActions';
import { StoryCreateIntro } from '@/_pages/storyCreate/ui/components/storyCreateIntro';
import { StoryFolderChoice } from '@/_pages/storyCreate/ui/components/storyFolderChoice';
import { StoryMoodSelector } from '@/_pages/storyCreate/ui/components/storyMoodSelector';
import { STORY_FOLDER_LIMIT, type StoryCreateStep, type StoryMood } from '@/features/createStory';
import { PageHeader } from '@/shared/ui/pageHeader';

import { storyFolders, storyTrip } from './fixtures/story';

type ExampleArgs = {
  step: StoryCreateStep;
  initialMood: StoryMood | null;
  initialSelectedCount: number;
  isChecking: boolean;
  onBack: () => void;
  onGenerate: (values: { mood: StoryMood | null; tripPlaceIds: number[] }) => void;
};

function StoryCreateExample(args: ExampleArgs) {
  const [step, setStep] = useState(args.step);
  const [mood, setMood] = useState(args.initialMood);
  const [selectedIds, setSelectedIds] = useState(() =>
    storyFolders
      .slice(0, Math.min(args.initialSelectedCount, STORY_FOLDER_LIMIT))
      .map((folder) => folder.id),
  );
  return (
    <section className="text-brand bg-surface mx-auto flex h-dvh max-h-[932px] w-full max-w-[430px] flex-col overflow-hidden px-6 pt-[max(8px,env(safe-area-inset-top))]">
      <PageHeader
        title={storyTrip.name}
        backLabel={step === 'mood' ? '여행 상세로 돌아가기' : '분위기 선택으로 돌아가기'}
        onBack={() => {
          if (step === 'folder') {
            setStep('mood');
            setSelectedIds([]);
          } else args.onBack();
        }}
        className="shrink-0"
      />
      <StoryCreateIntro trip={storyTrip} step={step} selectedCount={selectedIds.length} />
      {step === 'mood' ? (
        <StoryMoodSelector mood={mood} onChange={setMood} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pb-2" aria-label="샘플 폴더 목록">
          <ul className="grid grid-cols-2 gap-3">
            {storyFolders.map((folder) => (
              <li key={folder.id}>
                <StoryFolderChoice
                  folder={folder}
                  selected={selectedIds.includes(folder.id)}
                  onToggle={() =>
                    setSelectedIds((current) =>
                      current.includes(folder.id)
                        ? current.filter((id) => id !== folder.id)
                        : current.length < STORY_FOLDER_LIMIT
                          ? [...current, folder.id]
                          : current,
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      <StoryCreateActions
        step={step}
        selectedCount={selectedIds.length}
        canProceed={step === 'mood' ? !!mood : selectedIds.length > 0}
        isChecking={args.isChecking}
        onProceed={() =>
          step === 'mood' ? setStep('folder') : args.onGenerate({ mood, tripPlaceIds: selectedIds })
        }
      />
    </section>
  );
}

const meta = {
  title: 'Patterns/StoryCreate',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '실제 분위기·폴더 선택 UI와 제출 버튼의 조합입니다. 폴더는 샘플이며 생성 요청은 Actions에만 기록합니다. API와 임시 저장은 사용하지 않습니다.',
      },
    },
  },
  args: {
    step: 'mood',
    initialMood: null,
    initialSelectedCount: 0,
    isChecking: false,
    onBack: fn(),
    onGenerate: fn(),
  },
  argTypes: {
    step: { control: 'select', options: ['mood', 'folder'] },
    initialMood: {
      control: 'select',
      options: [null, 'PLAIN', 'EMOTIONAL', 'HUMOROUS', 'CALM', 'LITERARY'],
    },
    initialSelectedCount: { control: { type: 'range', min: 0, max: STORY_FOLDER_LIMIT, step: 1 } },
  },
  render: (args) => (
    <StoryCreateExample
      key={`${args.step}:${args.initialMood}:${args.initialSelectedCount}:${args.isChecking}`}
      {...args}
    />
  ),
} satisfies Meta<ExampleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mood: Story = { name: '분위기 선택 · 선택 없음' };
export const MoodSelected: Story = { name: '분위기 선택됨', args: { initialMood: 'PLAIN' } };
export const Folders: Story = {
  name: '폴더 선택 · 선택 없음',
  args: { step: 'folder', initialMood: 'PLAIN' },
};
export const FoldersSelected: Story = {
  name: '폴더 선택됨',
  args: { step: 'folder', initialMood: 'PLAIN', initialSelectedCount: 2 },
};
export const FolderLimit: Story = {
  name: '폴더 10개 선택',
  args: { step: 'folder', initialMood: 'PLAIN', initialSelectedCount: STORY_FOLDER_LIMIT },
};
export const CheckingAi: Story = {
  name: 'AI 준비 확인 중',
  args: { step: 'folder', initialMood: 'PLAIN', initialSelectedCount: 2, isChecking: true },
};
