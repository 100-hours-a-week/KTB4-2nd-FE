export class HeicPreviewResourceError extends Error {
  constructor(
    public readonly kind: 'network' | 'module',
    cause?: unknown,
  ) {
    super('HEIC 미리보기에 필요한 코드를 준비하지 못했습니다.', { cause });
    this.name = 'HeicPreviewResourceError';
  }
}
