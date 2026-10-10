import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTripPlaceFolders } from '@/features/tripDetail';
import type { TripDetail } from '@/features/tripDetail';
import { clearStoryGenerationJobs } from '@/features/createStory/model/storyGenerationStore';
import { StoryCreatePage } from './storyCreatePage';
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/features/tripDetail/api/getTripPlaceFolders', () => ({ getTripPlaceFolders: vi.fn() }));
const trip: TripDetail = {
  id: 7,
  name: '제주도 가을 여행',
  locations: ['제주'],
  startDate: '2026-10-12',
  endDate: '2026-10-14',
  nights: 2,
  photoCount: 128,
  reviewCount: 0,
  hasStory: false,
};
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <StoryCreatePage trip={trip} nickname="여담" runGeneration={() => new Promise(() => {})} />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTripPlaceFolders).mockResolvedValue({
    folders: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `장소 ${i + 1}`,
      photoCount: 3,
      accent: 'coast' as const,
    })),
    hasNext: false,
    nextCursor: null,
  });
});
afterEach(() => clearStoryGenerationJobs());
describe('StoryCreatePage', () => {
  it('기본 선택 없이 시작하고 분위기를 하나만 선택한다', async () => {
    const user = setup();
    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();
    expect(
      screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked),
    ).toBe(true);
    await user.click(screen.getByRole('radio', { name: /감성적으로/ }));
    await user.click(screen.getByRole('radio', { name: /차분하게/ }));
    expect(screen.getByRole('radio', { name: /감성적으로/ })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: '생성' }));
    expect(await screen.findAllByRole('checkbox')).toHaveLength(6);
    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();
  });
  it('최대 10개만 선택하고 선택 해제 후 다른 폴더를 선택한다', async () => {
    const user = setup();
    await user.click(screen.getByRole('radio', { name: /담백하게/ }));
    await user.click(screen.getByRole('button', { name: '생성' }));
    await screen.findAllByRole('checkbox');
    await user.click(screen.getByRole('button', { name: '폴더 더 보기' }));
    const boxes = screen.getAllByRole('checkbox');
    for (const box of boxes.slice(0, 11)) await user.click(box);
    expect(boxes[10]).not.toBeChecked();
    expect(screen.getByLabelText('선택한 폴더 수')).toHaveTextContent('10 / 10');
    await user.click(boxes[0]);
    await user.click(boxes[10]);
    expect(boxes[10]).toBeChecked();
  });
  it('생성 중 뒤로가기에는 취소 모달이 나타나고 폴더 선택이 유지된다', async () => {
    const user = setup();
    await user.click(screen.getByRole('radio', { name: /유쾌하게/ }));
    await user.click(screen.getByRole('button', { name: '생성' }));
    await user.click((await screen.findAllByRole('checkbox'))[0]);
    await user.click(screen.getByRole('button', { name: '생성' }));
    expect(screen.getByRole('button', { name: /스토리 생성 중/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '스토리 생성에서 돌아가기' }));
    let dialog = screen.getByRole('dialog', { name: '스토리 생성을 취소할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '이어서 만들기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '스토리 생성에서 돌아가기' }));
    dialog = screen.getByRole('dialog', { name: '스토리 생성을 취소할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '취소하기' }));
    expect(screen.getByRole('checkbox', { name: '장소 1 사진 3장 선택' })).toBeChecked();
  });
  it('다른 작업 이어하기는 취소 없이 여행 상세로 이동한다', async () => {
    const user = setup();
    await user.click(screen.getByRole('radio', { name: /담백하게/ }));
    await user.click(screen.getByRole('button', { name: '생성' }));
    await user.click((await screen.findAllByRole('checkbox'))[0]);
    await user.click(screen.getByRole('button', { name: '생성' }));
    expect(screen.getByRole('progressbar', { name: '스토리 생성 진행률' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    await user.click(screen.getByRole('button', { name: '다른 작업 이어하기' }));
    expect(push).toHaveBeenCalledWith('/trips/7');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: '스토리 생성 중' })).toBeInTheDocument();
  });
});
