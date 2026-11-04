import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef, useState } from 'react';
import { fn } from 'storybook/test';

import { ExistingTripPhotos } from '@/features/createTrip/ui/components/existingTripPhotos';
import { ImagePreviewFeedback } from '@/features/createTrip/ui/components/imagePreviewFeedback';
import { ImageUploadFieldView } from '@/features/createTrip/ui/components/imageUploadFieldView';
import { TripCreateStepLayout } from '@/features/createTrip/ui/components/tripCreateStepLayout';
import {
  TripFormModeContext,
  type TripFormMode,
} from '@/features/createTrip/ui/components/tripFormMode';
import { Button } from '@/shared/ui/button';

import { existingUploadPhotos, uploadSamples, uploadThumbnail } from './fixtures/imageUpload';

type ExampleArgs = {
  state:
    | 'empty'
    | 'selected'
    | 'loading'
    | 'network'
    | 'module'
    | 'conversion'
    | 'validation'
    | 'checking'
    | 'saving';
  mode: TripFormMode;
  onSelect: (files: File[]) => void;
  onRemove: (fileName: string) => void;
  onRetry: (fileName: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

function ImageUploadExample(args: ExampleArgs) {
  const [photos, setPhotos] = useState(
    args.state === 'empty' || args.state === 'validation' ? [] : uploadSamples,
  );
  const [recoveredIds, setRecoveredIds] = useState(new Set<string>());
  const [removedIds, setRemovedIds] = useState(new Set<number>());
  const sequence = useRef(0);
  const busy = args.state === 'checking' || args.state === 'saving';
  const error =
    args.state === 'validation'
      ? '사진을 한 장 이상 선택해주세요.'
      : args.state === 'conversion' &&
          photos.some((photo) => photo.id === 'sample-1' && !recoveredIds.has(photo.id))
        ? '열 수 없는 사진 1장이 있어요. 삭제한 뒤 여행을 만들어주세요.'
        : undefined;
  return (
    <div className="mx-auto h-dvh max-h-[932px] w-full max-w-[430px]">
      <TripFormModeContext value={args.mode}>
        <TripCreateStepLayout
          step="images"
          title={args.mode === 'edit' ? '사진을 수정해주세요' : '사진을 올려주세요'}
          description={
            args.mode === 'edit'
              ? '지울 사진은 눌러서 표시하고, 새 사진은 아래에 추가해주세요.'
              : '순서 상관없이 올려주시면 장소별로 정리해드릴게요.'
          }
          onBack={args.onBack}
          contentScrollable={false}
          footer={
            <Button
              className="w-full"
              disabled={args.mode === 'create' && (photos.length === 0 || !!error)}
              isLoading={busy}
              loadingText={args.state === 'checking' ? '위치 정보 확인 중…' : '저장하는 중…'}
              onClick={args.onSubmit}
            >
              {args.mode === 'edit' ? '수정 완료' : '여행 만들기'}
            </Button>
          }
        >
          <div className="flex h-full min-h-0 flex-col">
            {args.mode === 'edit' && (
              <ExistingTripPhotos
                existingPhotos={existingUploadPhotos}
                removedPhotoIds={removedIds}
                disabled={busy}
                onToggleRemove={(id) =>
                  setRemovedIds((current) => {
                    const next = new Set(current);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
              />
            )}
            <div className={`min-h-0 flex-1 ${args.mode === 'edit' ? 'mt-3' : ''}`}>
              <ImageUploadFieldView
                error={error}
                disabled={busy}
                onSelect={(files) => {
                  args.onSelect(files);
                  setPhotos((current) => [
                    ...current,
                    ...files.map((file) => ({
                      id: `selected-${++sequence.current}`,
                      fileName: file.name,
                    })),
                  ]);
                }}
                onRemove={(index) => {
                  args.onRemove(photos[index].fileName);
                  setPhotos((current) => current.filter((_, i) => i !== index));
                }}
                items={photos.map((photo) => {
                  const kind =
                    photo.id === 'sample-1' &&
                    !recoveredIds.has(photo.id) &&
                    ['loading', 'network', 'module', 'conversion'].includes(args.state)
                      ? (args.state as 'loading' | 'network' | 'module' | 'conversion')
                      : null;
                  return {
                    ...photo,
                    preview: kind ? (
                      <ImagePreviewFeedback
                        fileName={photo.fileName}
                        kind={kind}
                        disabled={busy}
                        onRetry={() => {
                          args.onRetry(photo.fileName);
                          setRecoveredIds((current) => new Set(current).add(photo.id));
                        }}
                      />
                    ) : (
                      <span
                        role="img"
                        aria-label={photo.fileName}
                        className="block size-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${JSON.stringify(uploadThumbnail)})` }}
                      />
                    ),
                  };
                })}
              />
            </div>
          </div>
        </TripCreateStepLayout>
      </TripFormModeContext>
    </div>
  );
}

const meta = {
  title: 'Patterns/ImageUpload',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '실제 사진 선택·미리보기 상태·기존 사진 삭제 표시 UI의 조합입니다. 썸네일은 샘플을 사용하며 선택한 파일도 이름과 샘플 이미지로 표시합니다. HEIC 변환과 업로드 API는 실행하지 않고 콜백은 Actions에 기록합니다.',
      },
    },
  },
  args: {
    state: 'empty',
    mode: 'create',
    onSelect: fn(),
    onRemove: fn(),
    onRetry: fn(),
    onSubmit: fn(),
    onBack: fn(),
  },
  argTypes: {
    state: {
      control: 'select',
      options: [
        'empty',
        'selected',
        'loading',
        'network',
        'module',
        'conversion',
        'validation',
        'checking',
        'saving',
      ],
    },
    mode: { control: 'select', options: ['create', 'edit'] },
  },
  render: (args) => <ImageUploadExample key={`${args.state}:${args.mode}`} {...args} />,
} satisfies Meta<ExampleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { name: '사진 선택 전' };
export const Selected: Story = { name: '사진 선택됨 · 삭제 가능', args: { state: 'selected' } };
export const PreviewLoading: Story = { name: '미리보기 준비 중', args: { state: 'loading' } };
export const WaitingForConnection: Story = {
  name: '연결 대기 · 재시도',
  args: { state: 'network' },
};
export const DecoderError: Story = {
  name: '미리보기 준비 실패 · 재시도',
  args: { state: 'module' },
};
export const BrokenPhoto: Story = {
  name: '열 수 없는 사진 · 재시도 또는 삭제',
  args: { state: 'conversion' },
};
export const ValidationError: Story = {
  name: '사진 선택 오류 안내',
  args: { state: 'validation' },
};
export const CheckingLocation: Story = { name: '위치 정보 확인 중', args: { state: 'checking' } };
export const EditPhotos: Story = {
  name: '여행 수정 · 삭제 표시와 취소',
  args: { mode: 'edit', state: 'selected' },
};
export const SavingPhotos: Story = {
  name: '여행 수정 · 저장 중',
  args: { mode: 'edit', state: 'saving' },
};
