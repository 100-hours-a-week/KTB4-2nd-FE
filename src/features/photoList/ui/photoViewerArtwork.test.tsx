import { act, render, screen } from '@testing-library/react';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { StrictMode } from 'react';

import { PhotoViewerArtwork } from './photoViewerArtwork';

const pending: { image: HTMLImageElement; resolve: () => void; reject: () => void }[] = [];
const defaults = {
  photoId: 1,
  thumbnailUrl: 'https://cdn.test/1-thumb.jpg',
  originalUrl: 'https://cdn.test/1.jpg',
  originalFailed: false,
  placeholder: <span>placeholder</span>,
};

type Props = ComponentProps<typeof PhotoViewerArtwork>;
const originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'decode');
afterAll(() => {
  if (originalDecode) Object.defineProperty(HTMLImageElement.prototype, 'decode', originalDecode);
  else Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
});

function setup() {
  const view = render(<PhotoViewerArtwork {...defaults} />);
  return {
    ...view,
    show: (props: Partial<Props>) => view.rerender(<PhotoViewerArtwork {...defaults} {...props} />),
    visible: () => view.container.querySelector('img')?.src,
  };
}

async function finish(url: string, reject = false, occurrence = 0) {
  const task = pending.filter(({ image }) => image.src === url)[occurrence];
  expect(task, `decode task for ${url}`).toBeDefined();
  await act(async () => {
    if (reject) task.reject();
    else task.resolve();
  });
}

beforeEach(() => {
  pending.length = 0;
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    value: vi.fn(function (this: HTMLImageElement) {
      return new Promise<void>((resolve, reject) => {
        pending.push({ image: this, resolve, reject: () => reject(new Error('decode failed')) });
      });
    }),
  });
});

describe('PhotoViewerArtwork', () => {
  it('ignores the discarded effect in Strict Mode', async () => {
    const view = render(
      <StrictMode>
        <PhotoViewerArtwork {...defaults} />
      </StrictMode>,
    );
    await finish(defaults.originalUrl);
    expect(view.container.querySelector('img')).toBeNull();
    await finish(defaults.originalUrl, false, 1);
    expect(view.container.querySelector('img')?.src).toBe(defaults.originalUrl);
  });

  it('shows failure feedback when there is no thumbnail and the URL API fails', async () => {
    const view = render(
      <PhotoViewerArtwork {...defaults} thumbnailUrl={null} originalUrl={null} originalFailed />,
    );
    await act(async () => {});
    expect(view.container.querySelector('img')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('사진을 불러오지 못했어요');
  });

  it('keeps the thumbnail until the original is decoded and displays the same decoded element', async () => {
    const view = setup();
    expect(view.visible()).toBeUndefined();
    await finish(defaults.thumbnailUrl);
    expect(view.visible()).toBe(defaults.thumbnailUrl);
    const original = pending.find(({ image }) => image.src === defaults.originalUrl)!.image;
    expect(original.isConnected).toBe(false);
    await finish(defaults.originalUrl);
    expect(view.container.querySelector('img')).toBe(original);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps the previous image while the next thumbnail loads', async () => {
    const view = setup();
    await finish(defaults.originalUrl);
    view.show({
      photoId: 2,
      thumbnailUrl: 'https://cdn.test/2-thumb.jpg',
      originalUrl: 'https://cdn.test/2.jpg',
    });
    expect(view.visible()).toBe(defaults.originalUrl);
    expect(screen.getByRole('status')).toHaveTextContent('사진 불러오는 중');
    await finish('https://cdn.test/2-thumb.jpg');
    expect(view.visible()).toBe('https://cdn.test/2-thumb.jpg');
    await finish('https://cdn.test/2.jpg');
    expect(view.visible()).toBe('https://cdn.test/2.jpg');
  });

  it('does not let a late thumbnail replace an original', async () => {
    const view = setup();
    await finish(defaults.originalUrl);
    await finish(defaults.thumbnailUrl);
    expect(view.visible()).toBe(defaults.originalUrl);
  });

  it('retains a decoded thumbnail when the original URL arrives without decoding it again', async () => {
    const view = render(<PhotoViewerArtwork {...defaults} originalUrl={null} />);
    await finish(defaults.thumbnailUrl);
    view.rerender(<PhotoViewerArtwork {...defaults} />);
    expect(view.container.querySelector('img')?.src).toBe(defaults.thumbnailUrl);
    expect(pending.filter(({ image }) => image.src === defaults.thumbnailUrl)).toHaveLength(1);
    await finish(defaults.originalUrl);
    expect(view.container.querySelector('img')?.src).toBe(defaults.originalUrl);
  });

  it('ignores late A and B completions after switching to C', async () => {
    const view = setup();
    view.show({ photoId: 2, originalUrl: 'https://cdn.test/2.jpg' });
    view.show({ photoId: 3, originalUrl: 'https://cdn.test/3.jpg' });
    await finish('https://cdn.test/3.jpg');
    await finish('https://cdn.test/2.jpg');
    await finish(defaults.originalUrl);
    expect(view.visible()).toBe('https://cdn.test/3.jpg');
  });

  it('rejects the first A generation after A → B → A', async () => {
    const view = setup();
    view.show({ photoId: 2, originalUrl: 'https://cdn.test/2.jpg' });
    view.show({});
    await finish(defaults.originalUrl);
    expect(view.visible()).toBeUndefined();
    await finish(defaults.originalUrl, false, 1);
    expect(view.visible()).toBe(defaults.originalUrl);
  });

  it('rejects an outdated URL for the same photo', async () => {
    const view = setup();
    view.show({ originalUrl: 'https://cdn.test/renewed.jpg' });
    await finish('https://cdn.test/renewed.jpg');
    await finish(defaults.originalUrl);
    expect(view.visible()).toBe('https://cdn.test/renewed.jpg');
  });

  it('keeps the current thumbnail if decoding the original fails', async () => {
    const view = setup();
    await finish(defaults.thumbnailUrl);
    await finish(defaults.originalUrl, true);
    expect(view.visible()).toBe(defaults.thumbnailUrl);
    expect(screen.queryByText('사진을 불러오지 못했어요')).not.toBeInTheDocument();
  });

  it('keeps the current thumbnail if the URL API fails', async () => {
    const view = setup();
    await finish(defaults.thumbnailUrl);
    view.show({ originalUrl: null, originalFailed: true });
    await act(async () => {});
    expect(view.visible()).toBe(defaults.thumbnailUrl);
    expect(screen.queryByText('사진을 불러오지 못했어요')).not.toBeInTheDocument();
  });

  it('replaces the previous photo with failure feedback if both new images fail', async () => {
    const view = setup();
    await finish(defaults.originalUrl);
    view.show({
      photoId: 2,
      thumbnailUrl: 'https://cdn.test/2-thumb.jpg',
      originalUrl: 'https://cdn.test/2.jpg',
    });
    await finish('https://cdn.test/2-thumb.jpg', true);
    expect(view.visible()).toBe(defaults.originalUrl);
    await finish('https://cdn.test/2.jpg', true);
    expect(view.visible()).toBeUndefined();
    expect(screen.getByRole('status')).toHaveTextContent('사진을 불러오지 못했어요');
  });

  it('ignores completions after closing the viewer', async () => {
    const view = setup();
    const host = view.container.querySelector('[aria-hidden="true"]')!;
    view.unmount();
    await finish(defaults.originalUrl);
    expect(host.querySelector('img')).toBeNull();
  });
});
