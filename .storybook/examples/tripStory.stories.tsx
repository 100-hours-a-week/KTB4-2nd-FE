import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { TripStoryPage } from '@/_pages/tripStory/ui/tripStoryPage';
import { photoListQueries } from '@/queryFactory';

import { tripStory } from './fixtures/story';

type ExampleArgs = {
  state: 'ready' | 'loading' | 'error' | 'empty' | 'missingPhoto';
  isRetrying: boolean;
  onRetry: () => void;
};

function TripStoryExample({ state, isRetrying, onRetry }: ExampleArgs) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          gcTime: Infinity,
          retry: false,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false,
        },
      },
    });
    // 뷰어도 원본 API 대신 미리 채운 샘플 이미지만 사용합니다.
    for (const day of tripStory.days) {
      for (const photo of day.photos) {
        if (photo.attachmentId === null || !photo.thumbnailUrl) continue;
        queryClient.setQueryData(photoListQueries.original(photo.attachmentId).queryKey, {
          tripAttachmentId: photo.attachmentId,
          originalUrl: photo.thumbnailUrl,
        });
      }
    }
    return queryClient;
  });
  const story = {
    ...tripStory,
    days:
      state === 'empty'
        ? []
        : tripStory.days.map((day) => ({
            ...day,
            photos: day.photos.map((photo) => ({
              ...photo,
              thumbnailUrl: state === 'missingPhoto' ? null : photo.thumbnailUrl,
            })),
          })),
  };
  return (
    <QueryClientProvider client={client}>
      <div className="mx-auto h-dvh max-h-[932px] w-full max-w-[430px] overflow-y-auto">
        <TripStoryPage
          story={story}
          isLoading={state === 'loading'}
          isRetrying={isRetrying}
          errorMessage={
            state === 'error' ? '스토리를 불러오지 못했어요. 잠시 후 다시 시도해주세요.' : undefined
          }
          onRetry={onRetry}
        />
      </div>
    </QueryClientProvider>
  );
}

const meta = {
  title: 'Patterns/TripStory',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '실제 스토리 조회 화면입니다. 타임라인과 원본 이미지는 샘플 데이터를 사용하며 조회 API는 호출하지 않습니다. 사진을 눌러 뷰어를 열고 키보드로 탐색할 수 있습니다.',
      },
    },
  },
  args: { state: 'ready', isRetrying: false, onRetry: fn() },
  argTypes: {
    state: { control: 'select', options: ['ready', 'loading', 'error', 'empty', 'missingPhoto'] },
  },
  render: (args) => <TripStoryExample key={args.state} {...args} />,
} satisfies Meta<ExampleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: '스토리 타임라인 · 사진 상세보기' };
export const Loading: Story = { name: '불러오는 중', args: { state: 'loading' } };
export const Error: Story = { name: '조회 실패', args: { state: 'error' } };
export const Retrying: Story = {
  name: '조회 재시도 중',
  args: { state: 'error', isRetrying: true },
};
export const Empty: Story = { name: '스토리 없음', args: { state: 'empty' } };
export const MissingPhoto: Story = {
  name: '썸네일 없음 · 원본 보기 가능',
  args: { state: 'missingPhoto' },
};
