import { act, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { UnclassifiedPhoto } from '@/features/unclassifiedPhotos';

import { usePhotoListPosition } from './usePhotoListPosition';

const photos: UnclassifiedPhoto[] = [1, 2].map((id) => ({
  id,
  accent: 'coast',
  restoreTripPlaceId: 10,
}));

function setup() {
  const root = document.createElement('div');
  root.style.overflowY = 'auto';
  root.scrollTop = 120;
  const main = document.createElement('main');
  const first = document.createElement('li');
  first.dataset.photoId = '1';
  const second = document.createElement('li');
  second.dataset.photoId = '2';
  main.append(first, second);
  root.append(main);
  document.body.append(root);
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 500 } as DOMRect);
  vi.spyOn(main, 'getBoundingClientRect').mockReturnValue({ height: 600 } as DOMRect);
  vi.spyOn(first, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect);
  const position = vi
    .spyOn(second, 'getBoundingClientRect')
    .mockReturnValue({ top: 200 } as DOMRect);
  const hook = renderHook(({ items, busy }) => usePhotoListPosition(items, busy), {
    initialProps: { items: photos, busy: false },
  });
  hook.result.current.mainRef.current = main;
  return { ...hook, root, main, first, position };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('정리 후 사진 목록 위치', () => {
  it('조회 중 높이를 유지하고 완료 후 남은 사진을 같은 화면 위치에 둔다', () => {
    const view = setup();
    act(() => view.result.current.capture([1]));
    view.rerender({ items: photos, busy: true });
    expect(view.main.style.minHeight).toBe('600px');
    view.first.remove();
    view.position.mockReturnValue({ top: 100 } as DOMRect);
    view.rerender({ items: [photos[1]], busy: false });
    expect(view.root.scrollTop).toBe(20);
    expect(view.main.style.minHeight).toBe('');
  });

  it('기다리는 동안 사용자가 스크롤하면 원래 위치로 강제로 이동시키지 않는다', () => {
    const view = setup();
    act(() => view.result.current.capture([1]));
    view.rerender({ items: photos, busy: true });
    fireEvent.wheel(view.root);
    view.root.scrollTop = 250;
    view.position.mockReturnValue({ top: 100 } as DOMRect);
    view.rerender({ items: [photos[1]], busy: false });
    expect(view.root.scrollTop).toBe(250);
    expect(view.main.style.minHeight).toBe('');
  });
});
