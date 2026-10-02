import { act, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { ImageUploadField } from './imageUploadField';

const { convertHeic } = vi.hoisted(() => ({ convertHeic: vi.fn() }));

vi.mock('heic-to', () => ({ heicTo: convertHeic }));

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
const originalIntersectionObserver = Object.getOwnPropertyDescriptor(
  globalThis,
  'IntersectionObserver',
);

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];
  readonly observedElements = new Set<Element>();

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.root = options.root ?? null;
    this.rootMargin = options.rootMargin ?? '0px';
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0];
    MockIntersectionObserver.instances.push(this);
  }

  observe = vi.fn((element: Element) => {
    this.observedElements.add(element);
  });

  unobserve = vi.fn((element: Element) => {
    this.observedElements.delete(element);
  });

  disconnect = vi.fn(() => {
    this.observedElements.clear();
  });

  trigger(element: Element, isIntersecting = true) {
    if (!this.observedElements.has(element)) return;

    this.callback(
      [{ isIntersecting, target: element } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function installIntersectionObserverMock() {
  MockIntersectionObserver.instances = [];
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    value: MockIntersectionObserver,
  });
}

afterEach(() => {
  vi.clearAllMocks();
  if (originalCreateObjectURL)
    Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
  else Reflect.deleteProperty(URL, 'createObjectURL');
  if (originalRevokeObjectURL)
    Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
  else Reflect.deleteProperty(URL, 'revokeObjectURL');
  if (originalIntersectionObserver)
    Object.defineProperty(globalThis, 'IntersectionObserver', originalIntersectionObserver);
  else Reflect.deleteProperty(globalThis, 'IntersectionObserver');
});

it('화면 근처에 들어온 사진만 미리보기로 변환한다', async () => {
  installIntersectionObserverMock();
  const firstFile = new File(['first-heic'], 'first.HEIC', { type: 'image/heic' });
  const secondFile = new File(['second-heic'], 'second.HEIC', { type: 'image/heic' });
  convertHeic.mockImplementation(async ({ blob }: { blob: Blob }) =>
    blob === firstFile
      ? new Blob(['first-preview'], { type: 'image/jpeg' })
      : new Blob(['second-preview'], { type: 'image/jpeg' }),
  );
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((blob: Blob) => `blob:http://localhost:3000/${blob.size}`),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });

  render(
    <ImageUploadField
      files={[firstFile, secondFile]}
      onSelect={vi.fn()}
      onRemove={vi.fn()}
    />,
  );

  const observer = MockIntersectionObserver.instances[0];
  const scrollRoot = screen.getByRole('region', { name: '선택한 사진 스크롤 영역' });
  const cards = screen.getAllByRole('listitem');

  expect(observer.root).toBe(scrollRoot);
  expect(observer.rootMargin).toBe('300px 0px');
  expect(observer.thresholds).toEqual([0.01]);
  expect(convertHeic).not.toHaveBeenCalled();

  act(() => observer.trigger(cards[0]));

  expect(await screen.findByRole('img', { name: 'first.HEIC' })).toBeInTheDocument();
  expect(screen.queryByRole('img', { name: 'second.HEIC' })).not.toBeInTheDocument();
  expect(convertHeic).toHaveBeenCalledTimes(1);
  expect(convertHeic).toHaveBeenCalledWith({
    blob: firstFile,
    type: 'image/jpeg',
    quality: 0.85,
  });

  act(() => observer.trigger(cards[1]));

  expect(await screen.findByRole('img', { name: 'second.HEIC' })).toBeInTheDocument();
  expect(convertHeic).toHaveBeenCalledTimes(2);

  act(() => observer.trigger(cards[0]));
  await waitFor(() => expect(convertHeic).toHaveBeenCalledTimes(2));
});

it('앞 사진을 삭제해도 남은 HEIC 미리보기를 다시 변환하지 않는다', async () => {
  installIntersectionObserverMock();
  const firstFile = new File(['first-heic'], 'first.HEIC', { type: 'image/heic' });
  const secondFile = new File(['second-heic'], 'second.HEIC', { type: 'image/heic' });
  convertHeic.mockImplementation(async ({ blob }: { blob: Blob }) =>
    blob === firstFile
      ? new Blob(['first-preview'], { type: 'image/jpeg' })
      : new Blob(['second-preview'], { type: 'image/jpeg' }),
  );
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((blob: Blob) => `blob:http://localhost:3000/${blob.size}`),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });

  const { rerender } = render(
    <ImageUploadField
      files={[firstFile, secondFile]}
      onSelect={vi.fn()}
      onRemove={vi.fn()}
    />,
  );

  const observer = MockIntersectionObserver.instances[0];
  const cards = screen.getAllByRole('listitem');
  act(() => observer.trigger(cards[0]));
  await screen.findByRole('img', { name: 'first.HEIC' });
  act(() => observer.trigger(cards[1]));
  await screen.findByRole('img', { name: 'second.HEIC' });
  expect(convertHeic).toHaveBeenCalledTimes(2);

  rerender(
    <ImageUploadField files={[secondFile]} onSelect={vi.fn()} onRemove={vi.fn()} />,
  );

  await screen.findByRole('img', { name: 'second.HEIC' });
  expect(convertHeic).toHaveBeenCalledTimes(2);
});

it('HEIC 사진을 JPEG blob으로 변환해 미리보기에 사용한다', async () => {
  const convertedBlob = new Blob(['jpeg-preview'], { type: 'image/jpeg' });
  convertHeic.mockResolvedValue(convertedBlob);
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((blob: Blob) =>
      blob === convertedBlob ? 'blob:http://localhost:3000/converted' : 'blob:original',
    ),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });

  const file = new File(['heic-photo'], 'photo.HEIC', { type: '' });
  render(<ImageUploadField files={[file]} onSelect={vi.fn()} onRemove={vi.fn()} />);

  expect(await screen.findByRole('img', { name: 'photo.HEIC' })).toHaveAttribute(
    'src',
    'blob:http://localhost:3000/converted',
  );
  expect(convertHeic).toHaveBeenCalledWith({
    blob: file,
    type: 'image/jpeg',
    quality: 0.85,
  });
});

it('Strict Mode에서도 사진 미리보기의 blob URL이 유효하다', async () => {
  const activeUrls = new Set<string>();
  let sequence = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => {
      const url = `blob:http://localhost:3000/preview-${++sequence}`;
      activeUrls.add(url);
      return url;
    }),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn((url: string) => activeUrls.delete(url)),
  });

  const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
  const { unmount } = render(
    <StrictMode>
      <ImageUploadField files={[file]} onSelect={vi.fn()} onRemove={vi.fn()} />
    </StrictMode>,
  );

  const previewUrl = (await screen.findByRole('img', { name: 'photo.jpg' })).getAttribute('src');
  expect(previewUrl).not.toBeNull();
  expect(activeUrls.has(previewUrl!)).toBe(true);
  expect(activeUrls.size).toBe(1);

  unmount();
  expect(activeUrls.size).toBe(0);
});

it('선택한 사진 목록만 스크롤 영역으로 사용한다', () => {
  const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
  render(<ImageUploadField files={[file]} onSelect={vi.fn()} onRemove={vi.fn()} />);

  expect(screen.getByRole('region', { name: '선택한 사진 스크롤 영역' })).toHaveClass(
    'overflow-y-auto',
    'min-h-0',
    'flex-1',
  );
  expect(screen.getByRole('list', { name: '선택한 사진 목록' })).toHaveClass(
    'grid',
    'grid-cols-3',
  );
  expect(screen.getByRole('list', { name: '선택한 사진 목록' })).not.toHaveClass(
    'overflow-y-auto',
    'flex-1',
  );
  expect(screen.getByText('눌러서 사진 선택하기').closest('label')).not.toHaveClass(
    'overflow-y-auto',
  );
});
