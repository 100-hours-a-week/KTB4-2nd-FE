import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { EmptyPhotoList } from '@/_pages/photoList/ui/components/emptyPhotoList';
import { PhotoDeleteDialog } from '@/_pages/photoList/ui/components/photoDeleteDialog';
import { PhotoGridItem } from '@/_pages/photoList/ui/components/photoGridItem';
import { PhotoGridSkeleton } from '@/_pages/photoList/ui/components/photoGridSkeleton';
import { PhotoListHeader } from '@/_pages/photoList/ui/components/photoListHeader';
import { PhotoSelectionToolbar } from '@/_pages/photoList/ui/components/photoSelectionToolbar';
import { BULK_DOWNLOAD_LIMIT, type PhotoListItem } from '@/features/photoList';
import { PhotoSelectionProgressPanel } from '@/features/photoList/ui/photoSelectionProgress';

type ExampleArgs = {
  selectionMode: boolean;
  initialSelectedCount: number;
  photoCount: number;
  isDownloading: boolean;
  isDeleting: boolean;
  isSelectingAll: boolean;
  contentState: 'ready' | 'loading' | 'error' | 'empty';
  onBack: () => void;
  onOpenPhoto: (photoId: number) => void;
  onDownload: (photoIds: number[]) => void;
  onDelete: (photoIds: number[]) => void;
  onRetry: () => void;
  onAdd: () => void;
};

const accents = ['coast', 'night', 'blossom', 'sunset', 'island', 'desert'] as const;

function PhotoListExample(args: ExampleArgs) {
  const photoCount = args.contentState === 'empty' ? 0 : args.photoCount;
  const [selectionMode, setSelectionMode] = useState(args.selectionMode);
  const [isSelectingAll, setIsSelectingAll] = useState(args.isSelectingAll);
  const [selectedIds, setSelectedIds] = useState(
    () =>
      new Set(
        Array.from(
          { length: Math.min(args.initialSelectedCount, photoCount) },
          (_, index) => index + 1,
        ),
      ),
  );
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>(() =>
    args.isDeleting ? [...selectedIds] : [],
  );
  const photos: PhotoListItem[] = Array.from({ length: photoCount }, (_, index) => ({
    id: index + 1,
    accent: accents[index % accents.length],
  }));
  const isProcessing = args.isDownloading || args.isDeleting;
  const allSelected = selectedIds.size === photos.length;

  function togglePhoto(photoId: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  return (
    <section className="text-brand bg-surface mx-auto flex h-dvh max-h-[932px] w-full max-w-[430px] flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <PhotoListHeader
          placeName="제주시"
          selectionMode={selectionMode}
          selectedCount={selectedIds.size}
          allSelected={allSelected}
          canSelect={args.contentState === 'ready' && photos.length > 0}
          selectionDisabled={isSelectingAll || isProcessing}
          cancelDisabled={isProcessing}
          onBack={args.onBack}
          onEnterSelection={() => setSelectionMode(true)}
          onCancelSelection={() => {
            setSelectionMode(false);
            setSelectedIds(new Set());
            setIsSelectingAll(false);
          }}
          onToggleAll={() =>
            setSelectedIds(allSelected ? new Set() : new Set(photos.map((photo) => photo.id)))
          }
        />
        <p className="text-muted mt-1 text-[11px]">
          제주도 가을 여행
          {(args.contentState === 'ready' || args.contentState === 'empty') &&
            ` · ${isSelectingAll ? '전체 사진을 불러오는 중이에요' : selectionMode ? '사진을 눌러 선택하세요' : `사진 ${photos.length}장`}`}
        </p>
        {args.contentState === 'empty' ? (
          <EmptyPhotoList onAdd={args.onAdd} />
        ) : args.contentState !== 'ready' ? (
          <PhotoGridSkeleton showError={args.contentState === 'error'} onRetry={args.onRetry} />
        ) : (
          <ul aria-label="사진 목록" className="mt-3 grid grid-cols-3 gap-1">
            {photos.map((photo, index) => (
              <li key={photo.id}>
                <PhotoGridItem
                  photo={photo}
                  index={index}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(photo.id)}
                  disabled={isSelectingAll || isProcessing}
                  onActivate={() =>
                    selectionMode ? togglePhoto(photo.id) : args.onOpenPhoto(photo.id)
                  }
                  onLongPress={() => {
                    setSelectionMode(true);
                    setSelectedIds((current) => new Set(current).add(photo.id));
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectionMode &&
        args.contentState === 'ready' &&
        (isSelectingAll ? (
          <div className="m-4 shrink-0">
            <PhotoSelectionProgressPanel
              loadedCount={photos.length}
              onCancel={() => setIsSelectingAll(false)}
            />
          </div>
        ) : (
          <div className="shrink-0 shadow-navigation">
            <PhotoSelectionToolbar
              disabled={selectedIds.size === 0}
              downloadLimitExceeded={selectedIds.size > BULK_DOWNLOAD_LIMIT}
              isDownloading={args.isDownloading}
              isDeleting={args.isDeleting}
              onDownload={() => args.onDownload([...selectedIds])}
              onDelete={() => setPendingDeleteIds([...selectedIds])}
            />
          </div>
        ))}
      <PhotoDeleteDialog
        count={pendingDeleteIds.length}
        isDeleting={args.isDeleting}
        onCancel={() => setPendingDeleteIds([])}
        onConfirm={() => {
          args.onDelete(pendingDeleteIds);
          setPendingDeleteIds([]);
        }}
      />
    </section>
  );
}

const meta = {
  title: 'Patterns/PhotoList',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '실제 사진 목록의 헤더·사진 셀·작업 버튼·삭제 확인창을 사용하는 조합 예시입니다. 사진은 샘플이며 다운로드·삭제 요청은 Actions에만 기록합니다. 실제 API는 호출하지 않습니다.',
      },
    },
  },
  args: {
    selectionMode: false,
    initialSelectedCount: 0,
    photoCount: 6,
    isDownloading: false,
    isDeleting: false,
    isSelectingAll: false,
    contentState: 'ready',
    onBack: fn(),
    onOpenPhoto: fn(),
    onDownload: fn(),
    onDelete: fn(),
    onRetry: fn(),
    onAdd: fn(),
  },
  argTypes: {
    initialSelectedCount: { control: { type: 'range', min: 0, max: 201, step: 1 } },
    photoCount: { control: { type: 'number', min: 1, max: 201, step: 1 } },
    contentState: { control: 'select', options: ['ready', 'loading', 'error', 'empty'] },
  },
  render: (args) => (
    <PhotoListExample
      key={`${args.selectionMode}:${args.initialSelectedCount}:${args.photoCount}:${args.isDownloading}:${args.isDeleting}:${args.isSelectingAll}:${args.contentState}`}
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
export const Downloading: Story = {
  name: '다운로드 중',
  args: { selectionMode: true, initialSelectedCount: 2, isDownloading: true },
};
export const DownloadLimitExceeded: Story = {
  name: '다운로드 제한 초과 · 201장',
  args: { selectionMode: true, initialSelectedCount: 201, photoCount: 201 },
};
export const SelectingAll: Story = {
  name: '전체 선택 불러오는 중 · 취소 가능',
  args: { selectionMode: true, initialSelectedCount: 1, isSelectingAll: true },
};
export const Deleting: Story = {
  name: '삭제 중',
  args: { selectionMode: true, initialSelectedCount: 2, isDeleting: true },
};
export const Empty: Story = { name: '빈 폴더', args: { contentState: 'empty' } };
export const Loading: Story = { name: '사진 불러오는 중', args: { contentState: 'loading' } };
export const LoadError: Story = { name: '사진 로드 실패', args: { contentState: 'error' } };
