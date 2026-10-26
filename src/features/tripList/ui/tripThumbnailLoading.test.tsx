import { act, render, screen } from '@testing-library/react';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { UnclassifiedFolderPage } from '@/_pages/unclassifiedFolder/ui/unclassifiedFolderPage';
import { PlaceFolderCard } from '@/_pages/tripDetail/ui/components/placeFolderCard';
import type { TripListItem } from '../model/types';
import { TripCard } from './tripCard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/features/unclassifiedPhotos/model/useUnclassifiedFolders', () => ({
  useUnclassifiedFolders: () => ({
    folders: [
      {
        issue: 'BLURRY',
        photoCount: 30,
        accent: 'coast',
        thumbnailUrl: 'https://cdn.test/trip.jpg',
      },
    ],
    viewState: 'ready',
    refetch: vi.fn(),
  }),
}));

const pending: { image: HTMLImageElement; resolve: () => void }[] = [];
const originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'decode');
afterAll(() => {
  if (originalDecode) Object.defineProperty(HTMLImageElement.prototype, 'decode', originalDecode);
  else Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
});
beforeEach(() => {
  pending.length = 0;
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    value: vi.fn(function (this: HTMLImageElement) {
      return new Promise<void>((resolve) => pending.push({ image: this, resolve }));
    }),
  });
});
const trip: TripListItem = {
  id: 1,
  name: '테스트 여행',
  locations: [],
  startDate: '2026-01-01',
  endDate: '2026-01-02',
  nights: 1,
  photoCount: 30,
  favorite: false,
  processingStatus: 'ready',
  thumbnailUrl: 'https://cdn.test/trip.jpg',
};

for (const type of ['여행 카드', '장소 폴더', '미분류 폴더'] as const) {
  describe(type, () => {
    it('첫 진입 시 정보는 즉시 표시하고 썸네일 디코딩이 끝날 때까지 스켈레톤을 유지한다', async () => {
      const view = render(
        type === '여행 카드' ? (
          <TripCard trip={trip} colorIndex={1} onFavoriteChange={() => {}} />
        ) : type === '미분류 폴더' ? (
          <UnclassifiedFolderPage tripId={1} tripName="테스트 여행" />
        ) : (
          <PlaceFolderCard
            trip={{ ...trip, reviewCount: 0, hasStory: false }}
            folder={{
              id: 2,
              name: '테스트 장소',
              photoCount: 30,
              accent: 'coast',
              thumbnailUrl: trip.thumbnailUrl,
            }}
          />
        ),
      );
      expect(
        type === '미분류 폴더'
          ? screen.getByRole('link', { name: '흐릿한 사진 30장 보기' })
          : screen.getByText(type === '여행 카드' ? '테스트 여행' : '테스트 장소'),
      ).toBeInTheDocument();
      expect(view.container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
      expect(view.container.querySelector('img')).not.toBeInTheDocument();
      expect(pending).toHaveLength(1);
      await act(async () => pending[0].resolve());
      expect(view.container.querySelector('img')).toBe(pending[0].image);
      expect(view.container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
    });
  });
}

it('여행 수정 상태가 바뀌어도 준비된 썸네일은 유지하고 수정 중 안내만 겹친다', async () => {
  const view = render(<TripCard trip={trip} colorIndex={1} onFavoriteChange={() => {}} />);
  await act(async () => pending[0].resolve());
  const image = view.container.querySelector('img');
  view.rerender(
    <TripCard
      trip={{ ...trip, processingStatus: 'updating' }}
      colorIndex={1}
      onFavoriteChange={() => {}}
    />,
  );
  expect(view.container.querySelector('img')).toBe(image);
  expect(screen.getByRole('status', { name: '여행 수정 중' })).toBeInTheDocument();
  expect(pending).toHaveLength(1);
  view.rerender(<TripCard trip={trip} colorIndex={1} onFavoriteChange={() => {}} />);
  expect(view.container.querySelector('img')).toBe(image);
  expect(screen.queryByRole('status', { name: '여행 수정 중' })).not.toBeInTheDocument();
});
