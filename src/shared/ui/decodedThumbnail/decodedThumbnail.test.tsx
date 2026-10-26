import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { DecodedThumbnail } from './decodedThumbnail';

const A = 'https://cdn.test/a.jpg';
const B = 'https://cdn.test/b.jpg';
const C = 'https://cdn.test/c.jpg';
const tasks: { image: HTMLImageElement; resolve: () => void; reject: () => void }[] = [];
const originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'decode');
afterAll(() => {
  if (originalDecode) Object.defineProperty(HTMLImageElement.prototype, 'decode', originalDecode);
  else Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
});
beforeEach(() => {
  tasks.length = 0;
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    value: vi.fn(function (this: HTMLImageElement) {
      return new Promise<void>((resolve, reject) =>
        tasks.push({ image: this, resolve, reject: () => reject(new Error('failed')) }),
      );
    }),
  });
});

function thumbnail(src: string | null = A, imageKey = '1') {
  return (
    <DecodedThumbnail
      imageKey={imageKey}
      src={src}
      className="size-20 rounded-xl"
      fallback={<span>기본 썸네일</span>}
    />
  );
}
async function finish(src: string, fail = false, occurrence = 0) {
  const task = tasks.filter((task) => task.image.src === src)[occurrence];
  expect(task).toBeDefined();
  await act(async () => (fail ? task.reject() : task.resolve()));
  return task.image;
}

describe('DecodedThumbnail', () => {
  it('첫 진입에는 빈 영역 대신 스켈레톤을 유지하고 디코딩한 요소를 그대로 표시한다', async () => {
    const view = render(thumbnail());
    expect(view.container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText('기본 썸네일')).not.toBeInTheDocument();
    expect(view.container.querySelector('img')).not.toBeInTheDocument();
    const image = await finish(A);
    expect(view.container.querySelector('img')).toBe(image);
    expect(view.container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  });
  it('URL 갱신 중에는 기존 이미지를 유지한다', async () => {
    const view = render(thumbnail());
    const previous = await finish(A);
    view.rerender(thumbnail(B));
    expect(view.container.querySelector('img')).toBe(previous);
    expect(view.container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    const next = await finish(B);
    expect(view.container.querySelector('img')).toBe(next);
  });
  it('빠른 A→B→C 변경에서 늦게 완료된 B는 C를 덮지 않는다', async () => {
    const view = render(thumbnail());
    await finish(A);
    view.rerender(thumbnail(B));
    view.rerender(thumbnail(C));
    const current = await finish(C);
    await finish(B);
    expect(view.container.querySelector('img')).toBe(current);
  });
  it('아직 준비 중인 A→B→A도 전환 세대로 구분한다', async () => {
    const view = render(thumbnail());
    view.rerender(thumbnail(B));
    view.rerender(thumbnail(A));
    await finish(A);
    await finish(B);
    expect(view.container.querySelector('img')).not.toBeInTheDocument();
    expect(view.container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    const current = await finish(A, false, 1);
    expect(view.container.querySelector('img')).toBe(current);
  });
  it('이미 준비된 A로 돌아오면 기존 요소를 재사용하고 B의 완료는 무시한다', async () => {
    const view = render(thumbnail());
    const image = await finish(A);
    view.rerender(thumbnail(B));
    view.rerender(thumbnail(A));
    await finish(B);
    expect(view.container.querySelector('img')).toBe(image);
    expect(tasks.filter((task) => task.image.src === A)).toHaveLength(1);
  });
  it('다른 항목으로 바뀌면 이전 항목의 사진을 보여주지 않는다', async () => {
    const view = render(thumbnail());
    await finish(A);
    view.rerender(thumbnail(B, '2'));
    expect(view.container.querySelector('img')).not.toBeInTheDocument();
    const next = await finish(B);
    expect(view.container.querySelector('img')).toBe(next);
  });
  it('첫 이미지 실패 시 기본 썸네일을 표시한다', async () => {
    const view = render(thumbnail());
    await finish(A, true);
    expect(screen.getByText('기본 썸네일')).toBeInTheDocument();
    expect(view.container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  });
  it('새 URL 디코딩 실패 시 마지막 정상 이미지를 유지한다', async () => {
    const view = render(thumbnail());
    const image = await finish(A);
    view.rerender(thumbnail(B));
    await finish(B, true);
    expect(view.container.querySelector('img')).toBe(image);
  });
  it('썸네일 URL이 없으면 다운로드 없이 기본 이미지를 표시한다', () => {
    render(thumbnail(null));
    expect(screen.getByText('기본 썸네일')).toBeInTheDocument();
    expect(tasks).toHaveLength(0);
  });
  it('URL을 제거했다 다시 설정해도 새 이미지가 준비되기 전 스켈레톤을 유지한다', async () => {
    const view = render(thumbnail());
    await finish(A);
    view.rerender(thumbnail(null));
    expect(view.container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.getByText('기본 썸네일')).toBeInTheDocument();
    view.rerender(thumbnail(A));
    expect(view.container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    const image = await finish(A, false, 1);
    expect(view.container.querySelector('img')).toBe(image);
  });
  it('언마운트 후 완료된 결과를 버린다', async () => {
    const view = render(thumbnail());
    const host = view.container.firstElementChild;
    view.unmount();
    await finish(A);
    expect(host?.querySelector('img')).not.toBeInTheDocument();
    expect(host?.querySelector('img')).toBeNull();
  });
  it('StrictMode에서 폐기된 effect의 디코딩 결과를 무시한다', async () => {
    const view = render(<StrictMode>{thumbnail()}</StrictMode>);
    await finish(A);
    expect(view.container.querySelector('img')).not.toBeInTheDocument();
    const current = await finish(A, false, 1);
    expect(view.container.querySelector('img')).toBe(current);
  });
});
