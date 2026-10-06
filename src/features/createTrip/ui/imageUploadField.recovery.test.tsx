import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { HeicPreviewResourceError } from '../model/heicPreviewError';
import { ImageUploadField } from './imageUploadField';

const { prepare, decode } = vi.hoisted(() => ({ prepare: vi.fn(), decode: vi.fn() }));
vi.mock('../model/heicPreviewDecoder', () => ({
  prepareHeicPreviewDecoder: prepare,
  resetHeicPreviewDecoder: vi.fn(),
}));

beforeEach(() => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  prepare.mockReset().mockResolvedValue(decode);
  decode
    .mockReset()
    .mockImplementation(async () => ({ width: 4000, height: 3000, close: vi.fn() }));
  let sequence = 0;
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => `blob:preview-${++sequence}`);
      static revokeObjectURL = vi.fn();
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
    callback(new Blob(['jpeg'])),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('online 이벤트 없이 실제 연결만 복구되어도 재확인 후 미리보기를 표시한다', async () => {
  vi.useFakeTimers();
  let reachable = false;
  prepare.mockImplementation(async () => {
    if (!reachable) throw new HeicPreviewResourceError('network');
    return decode;
  });
  const file = new File(['heic'], 'photo.heic', { type: 'image/heic' });
  await act(async () => {
    render(<ImageUploadField files={[file]} onSelect={vi.fn()} onRemove={vi.fn()} />);
  });
  expect(screen.getByText('인터넷 연결을 기다리고 있어요')).toBeInTheDocument();
  reachable = true;
  await act(async () => vi.advanceTimersByTimeAsync(5_000));
  expect(screen.getByRole('img', { name: file.name })).toBeInTheDocument();
  expect(decode).toHaveBeenCalledOnce();
});

it('사진 단계에서 나가면 연결 재확인 타이머도 중지한다', async () => {
  vi.useFakeTimers();
  prepare.mockRejectedValue(new HeicPreviewResourceError('network'));
  const { unmount } = render(
    <ImageUploadField files={[]} onSelect={vi.fn()} onRemove={vi.fn()} />,
  );
  await act(async () => vi.advanceTimersByTimeAsync(0));
  unmount();
  const count = prepare.mock.calls.length;
  await act(async () => vi.advanceTimersByTimeAsync(60_000));
  expect(prepare).toHaveBeenCalledTimes(count);
});

it('사진 단계에서는 파일 선택 전에도 디코더를 준비하되 사진 변환은 시작하지 않는다', async () => {
  render(<ImageUploadField files={[]} onSelect={vi.fn()} onRemove={vi.fn()} />);
  await waitFor(() => expect(prepare).toHaveBeenCalledOnce());
  expect(decode).not.toHaveBeenCalled();
});

it('오프라인의 HEIC는 연결을 기다리고 JPG는 표시하며 복구 후 같은 파일로 자동 재시도한다', async () => {
  let online = false;
  vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
  prepare.mockImplementation(async () => {
    if (!online) throw new HeicPreviewResourceError('network');
    return decode;
  });
  const heic = new File(['heic'], 'photo.heic', { type: 'image/heic' });
  const jpeg = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' });
  render(<ImageUploadField files={[heic, jpeg]} onSelect={vi.fn()} onRemove={vi.fn()} />);
  expect(await screen.findByText('인터넷 연결을 기다리고 있어요')).toBeInTheDocument();
  const jpegUrl = screen.getByRole('img', { name: jpeg.name }).getAttribute('src');
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(decode).not.toHaveBeenCalled();
  await act(async () => {
    online = true;
    window.dispatchEvent(new Event('online'));
  });
  expect(await screen.findByRole('img', { name: heic.name })).toBeInTheDocument();
  expect(decode).toHaveBeenCalledOnce();
  expect(decode).toHaveBeenCalledWith(heic, expect.any(AbortSignal));
  expect(screen.getByRole('img', { name: jpeg.name })).toHaveAttribute('src', jpegUrl);
});

it('모듈 실패는 파일 변환 실패와 다르게 안내하고 버튼으로 복구한다', async () => {
  let ready = false;
  prepare.mockImplementation(async () => {
    if (!ready) throw new HeicPreviewResourceError('module');
    return decode;
  });
  const file = new File(['heic'], 'photo.heic', { type: 'image/heic' });
  render(<ImageUploadField files={[file]} onSelect={vi.fn()} onRemove={vi.fn()} />);
  expect(await screen.findByText('미리보기 준비에 실패했어요')).toBeInTheDocument();
  ready = true;
  fireEvent.click(screen.getByRole('button', { name: 'photo.heic 미리보기 다시 시도' }));
  expect(await screen.findByRole('img', { name: file.name })).toBeInTheDocument();
  expect(decode).toHaveBeenCalledOnce();
});

it('파일 변환 실패는 온라인 이벤트로 반복하지 않고 사용자가 재시도할 수 있다', async () => {
  decode.mockRejectedValueOnce(new Error('잘못된 파일'));
  const file = new File(['heic'], 'photo.heic', { type: 'image/heic' });
  render(<ImageUploadField files={[file]} onSelect={vi.fn()} onRemove={vi.fn()} />);
  expect(await screen.findByText('미리보기 불가')).toBeInTheDocument();
  await act(async () => window.dispatchEvent(new Event('online')));
  expect(decode).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'photo.heic 미리보기 다시 시도' }));
  expect(await screen.findByRole('img', { name: file.name })).toBeInTheDocument();
  expect(decode).toHaveBeenCalledTimes(2);
});

it('오프라인 중 삭제한 사진은 연결이 복구되어도 변환하지 않는다', async () => {
  prepare.mockRejectedValue(new HeicPreviewResourceError('network'));
  const file = new File(['heic'], 'photo.heic', { type: 'image/heic' });
  const { rerender, unmount } = render(
    <ImageUploadField files={[file]} onSelect={vi.fn()} onRemove={vi.fn()} />,
  );
  await screen.findByText('인터넷 연결을 기다리고 있어요');
  rerender(<ImageUploadField files={[]} onSelect={vi.fn()} onRemove={vi.fn()} />);
  prepare.mockResolvedValue(decode);
  await act(async () => window.dispatchEvent(new Event('online')));
  expect(decode).not.toHaveBeenCalled();
  unmount();
  const count = prepare.mock.calls.length;
  await act(async () => window.dispatchEvent(new Event('online')));
  expect(prepare).toHaveBeenCalledTimes(count);
});
