import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { UnclassifiedPhotoActions } from '@/_pages/unclassifiedPhotoList/ui/components/unclassifiedPhotoActions';
import { UnclassifiedPhotoHeader } from '@/_pages/unclassifiedPhotoList/ui/components/unclassifiedPhotoHeader';
import { UnclassifiedPhotoGrid } from '@/_pages/unclassifiedPhotoList/ui/components/unclassifiedPhotoGrid';
import type { UnclassifiedPhoto } from '@/features/unclassifiedPhotos';

type ExampleArgs = {
  selectionMode: boolean;
  initialSelectedCount: number;
  isRestoring: boolean;
  isDeleting: boolean;
  onBack: () => void;
  onOpenPhoto: (photoId: number) => void;
  onRestore: () => void;
  onDelete: () => void;
};

const accents = [
  'coast',
  'night',
  'blossom',
  'sunset',
  'island',
  'desert',
] satisfies UnclassifiedPhoto['accent'][];
const photos: UnclassifiedPhoto[] = accents.map((accent, index) => ({
  id: index + 1,
  accent,
  restoreTripPlaceId: null,
}));

function UnclassifiedPhotosExample({
  selectionMode: initialSelectionMode,
  initialSelectedCount,
  isRestoring,
  isDeleting,
  onBack,
  onOpenPhoto,
  onRestore,
  onDelete,
}: ExampleArgs) {
  const [selectionMode, setSelectionMode] = useState(initialSelectionMode);
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(photos.slice(0, initialSelectedCount).map((photo) => photo.id)),
  );
  const isProcessing = isRestoring || isDeleting;
  const allSelected = selectedIds.size === photos.length;

  return (
    <section className="text-brand bg-surface mx-auto flex h-dvh max-h-[932px] w-full max-w-[430px] flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <UnclassifiedPhotoHeader
          label="흐릿한 사진"
          selectionMode={selectionMode}
          selectedCount={selectedIds.size}
          allSelected={allSelected}
          canSelect
          isProcessing={isProcessing}
          isSelectingAll={false}
          onBack={onBack}
          onCancelSelection={() => {
            setSelectionMode(false);
            setSelectedIds(new Set());
          }}
          onEnterSelection={() => setSelectionMode(true)}
          onToggleAll={() =>
            setSelectedIds(allSelected ? new Set() : new Set(photos.map((photo) => photo.id)))
          }
        />
        <p className="text-muted mt-1 text-[11px]">
          제주도 가을 여행 · {selectionMode ? '사진을 눌러 선택하세요' : '사진 6장'}
        </p>
        <UnclassifiedPhotoGrid
          photos={photos}
          label="샘플 사진"
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          isSelectingAll={false}
          disabled={isProcessing}
          showEmpty={false}
          onOpenPhoto={onOpenPhoto}
          onTogglePhoto={(photoId) =>
            setSelectedIds((current) => {
              const next = new Set(current);
              if (next.has(photoId)) next.delete(photoId);
              else next.add(photoId);
              return next;
            })
          }
        />
      </div>
      {selectionMode && (
        <div className="shrink-0 shadow-navigation">
          <UnclassifiedPhotoActions
            selectedCount={selectedIds.size}
            isRestoring={isRestoring}
            isDeleting={isDeleting}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        </div>
      )}
    </section>
  );
}

const meta = {
  title: 'Patterns/UnclassifiedPhotos',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '실제 미분류 사진 화면의 헤더·사진 그리드·작업 버튼을 사용하는 조합 예시입니다. 사진은 샘플이며 해제·삭제 콜백은 Actions에만 기록합니다. 실제 API는 호출하지 않습니다.',
      },
    },
  },
  args: {
    selectionMode: false,
    initialSelectedCount: 0,
    isRestoring: false,
    isDeleting: false,
    onBack: fn(),
    onOpenPhoto: fn(),
    onRestore: fn(),
    onDelete: fn(),
  },
  argTypes: {
    initialSelectedCount: { control: { type: 'range', min: 0, max: photos.length, step: 1 } },
  },
  render: (args) => (
    <UnclassifiedPhotosExample
      key={`${args.selectionMode}:${args.initialSelectedCount}:${args.isRestoring}:${args.isDeleting}`}
      {...args}
    />
  ),
} satisfies Meta<ExampleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: '일반 보기' };
export const NoSelection: Story = { name: '선택 모드 · 선택 없음', args: { selectionMode: true } };
export const Selected: Story = {
  name: '선택 모드 · 일부 선택',
  args: { selectionMode: true, initialSelectedCount: 2 },
};
export const AllSelected: Story = {
  name: '선택 모드 · 전체 선택',
  args: { selectionMode: true, initialSelectedCount: photos.length },
};
export const Restoring: Story = {
  name: '해제 중',
  args: { selectionMode: true, initialSelectedCount: 2, isRestoring: true },
};
export const Deleting: Story = {
  name: '삭제 중',
  args: { selectionMode: true, initialSelectedCount: 2, isDeleting: true },
};
