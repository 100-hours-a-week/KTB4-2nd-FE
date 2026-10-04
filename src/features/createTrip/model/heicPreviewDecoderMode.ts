export type HeicPreviewDecoderMode = 'js' | 'wasm';

export function getHeicPreviewDecoderMode(): HeicPreviewDecoderMode {
  const configured = process.env.NEXT_PUBLIC_HEIC_PREVIEW_DECODER;
  if (configured === 'js' || configured === 'wasm') return configured;

  // This is an experiment: keep production on the existing decoder until measured.
  return process.env.NODE_ENV === 'development' ? 'wasm' : 'js';
}
