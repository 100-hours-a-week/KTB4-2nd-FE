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

function installPreviewUrlMocks() {
  let sequence = 0;
  const createUrl = vi.fn(() => `blob:http://localhost:3000/preview-${++sequence}`);
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  return createUrl;
}

function deferredPreview() {
  let resolve!: (blob: Blob) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Blob>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
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
    <ImageUploadField files={[firstFile, secondFile]} onSelect={vi.fn()} onRemove={vi.fn()} />,
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
    <ImageUploadField files={[firstFile, secondFile]} onSelect={vi.fn()} onRemove={vi.fn()} />,
  );

  const observer = MockIntersectionObserver.instances[0];
  const cards = screen.getAllByRole('listitem');
  act(() => observer.trigger(cards[0]));
  await screen.findByRole('img', { name: 'first.HEIC' });
  act(() => observer.trigger(cards[1]));
  await screen.findByRole('img', { name: 'second.HEIC' });
  expect(convertHeic).toHaveBeenCalledTimes(2);

  rerender(<ImageUploadField files={[secondFile]} onSelect={vi.fn()} onRemove={vi.fn()} />);

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

it('HEIC는 선택 순서로 최대 두 장만 변환하고 JPEG는 기다리지 않는다', async () => {
  installPreviewUrlMocks();
  const files = Array.from(
    { length: 4 },
    (_, index) => new File(['heic'], `${index}.HEIC`, { type: 'image/heic' }),
  );
  const pending = files.map(() => deferredPreview());
  convertHeic.mockImplementation(
    ({ blob }: { blob: File }) => pending[files.indexOf(blob)].promise,
  );
  const jpeg = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' });

  render(<ImageUploadField files={[...files, jpeg]} onSelect={vi.fn()} onRemove={vi.fn()} />);

  await waitFor(() => expect(convertHeic).toHaveBeenCalledTimes(2));
  expect(convertHeic.mock.calls.map(([params]) => params.blob)).toEqual(files.slice(0, 2));
  expect(screen.getByRole('img', { name: jpeg.name })).toBeInTheDocument();

  await act(async () => pending[1].resolve(new Blob(['second'])));
  await waitFor(() => expect(convertHeic).toHaveBeenCalledTimes(3));
  expect(convertHeic.mock.calls[2][0].blob).toBe(files[2]);
  await act(async () => pending[0].resolve(new Blob(['first'])));
  await waitFor(() => expect(convertHeic).toHaveBeenCalledTimes(4));
  expect(convertHeic.mock.calls[3][0].blob).toBe(files[3]);
  await act(async () => {
    pending[2].resolve(new Blob(['third']));
    pending[3].resolve(new Blob(['fourth']));
  });
  for (const file of files) {
    expect(await screen.findByRole('img', { name: file.name })).toBeInTheDocument();
  }
});

it('대기 중인 사진을 삭제하면 변환하지 않고 나머지 사진을 처리한다', async () => {
  installPreviewUrlMocks();
  const files = Array.from(
    { length: 4 },
    (_, index) => new File(['heic'], `${index}.HEIC`, { type: 'image/heic' }),
  );
  const pending = files.map(() => deferredPreview());
  convertHeic.mockImplementation(
    ({ blob }: { blob: File }) => pending[files.indexOf(blob)].promise,
  );
  const { rerender } = render(
    <ImageUploadField files={files} onSelect={vi.fn()} onRemove={vi.fn()} />,
  );
  await waitFor(() => expect(convertHeic).toHaveBeenCalledTimes(2));

  rerender(
    <ImageUploadField
      files={[files[0], files[1], files[3]]}
      onSelect={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  await act(async () => pending[0].resolve(new Blob(['first'])));
  await waitFor(() => expect(convertHeic).toHaveBeenCalledTimes(3));
  expect(convertHeic.mock.calls[2][0].blob).toBe(files[3]);
  await act(async () => {
    pending[1].resolve(new Blob(['second']));
    pending[3].resolve(new Blob(['fourth']));
  });
  expect(await screen.findByRole('img', { name: files[3].name })).toBeInTheDocument();
  expect(convertHeic.mock.calls.map(([params]) => params.blob)).not.toContain(files[2]);
});

it('한 사진의 변환이 실패해도 대기 중인 다음 사진을 표시한다', async () => {
  installPreviewUrlMocks();
  const files = Array.from(
    { length: 3 },
    (_, index) => new File(['heic'], `${index}.HEIC`, { type: 'image/heic' }),
  );
  const pending = files.map(() => deferredPreview());
  convertHeic.mockImplementation(
    ({ blob }: { blob: File }) => pending[files.indexOf(blob)].promise,
  );
  render(<ImageUploadField files={files} onSelect={vi.fn()} onRemove={vi.fn()} />);
  await waitFor(() => expect(convertHeic).toHaveBeenCalledTimes(2));

  await act(async () => pending[0].reject(new Error('변환 실패')));
  expect(await screen.findByText('미리보기 불가')).toBeInTheDocument();
  await waitFor(() => expect(convertHeic).toHaveBeenCalledTimes(3));
  await act(async () => {
    pending[1].resolve(new Blob(['second']));
    pending[2].resolve(new Blob(['third']));
  });
  expect(await screen.findByRole('img', { name: files[2].name })).toBeInTheDocument();
});

it('Strict Mode에서는 정리된 HEIC 작업을 건너뛰고 한 번만 변환한다', async () => {
  const createUrl = installPreviewUrlMocks();
  convertHeic.mockResolvedValue(new Blob(['preview']));
  const file = new File(['heic'], 'photo.HEIC', { type: 'image/heic' });
  const { unmount } = render(
    <StrictMode>
      <ImageUploadField files={[file]} onSelect={vi.fn()} onRemove={vi.fn()} />
    </StrictMode>,
  );

  expect(await screen.findByRole('img', { name: file.name })).toBeInTheDocument();
  expect(convertHeic).toHaveBeenCalledOnce();
  expect(createUrl).toHaveBeenCalledOnce();
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
});

it('페이지를 나가면 대기 변환을 취소하고 실행 중 결과의 URL도 만들지 않는다', async () => {
  const createUrl = installPreviewUrlMocks();
  const pending = [deferredPreview(), deferredPreview()];
  const files = Array.from(
    { length: 3 },
    (_, index) => new File(['heic'], `${index}.HEIC`, { type: 'image/heic' }),
  );
  convertHeic.mockImplementation(
    ({ blob }: { blob: File }) => pending[files.indexOf(blob)].promise,
  );
  const { unmount } = render(
    <ImageUploadField files={files} onSelect={vi.fn()} onRemove={vi.fn()} />,
  );
  await waitFor(() => expect(convertHeic).toHaveBeenCalledTimes(2));

  unmount();
  await act(async () => {
    pending[0].resolve(new Blob(['first']));
    pending[1].resolve(new Blob(['second']));
  });

  expect(convertHeic).toHaveBeenCalledTimes(2);
  expect(createUrl).not.toHaveBeenCalled();
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
  expect(screen.getByRole('list', { name: '선택한 사진 목록' })).toHaveClass('grid', 'grid-cols-3');
  expect(screen.getByRole('list', { name: '선택한 사진 목록' })).not.toHaveClass(
    'overflow-y-auto',
    'flex-1',
  );
  expect(screen.getByText('눌러서 사진 선택하기').closest('label')).not.toHaveClass(
    'overflow-y-auto',
  );
});
