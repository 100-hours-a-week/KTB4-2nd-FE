import createLibheif, { type LibheifModule } from 'libheif-js/libheif-wasm/libheif-bundle.mjs';

import { decodeHeicPixels } from './decodeHeicPixels';
import type { HeicWasmRequest, HeicWasmResponse } from './heicWasmProtocol';

const scope = self as unknown as {
  onmessage: (event: MessageEvent<HeicWasmRequest>) => void;
  postMessage: (response: HeicWasmResponse) => void;
};
let modulePromise: Promise<LibheifModule> | null = null;

function loadLibheif() {
  if (!modulePromise) {
    modulePromise = Promise.resolve()
      .then(() => createLibheif())
      .catch((error: unknown) => {
        modulePromise = null;
        throw error;
      });
  }
  return modulePromise;
}

scope.onmessage = async ({ data }) => {
  const { id } = data;
  let libheif: LibheifModule;
  try {
    libheif = await loadLibheif();
  } catch (error) {
    scope.postMessage({
      id,
      error: error instanceof Error ? error.message : 'Wasm 초기화에 실패했습니다.',
      kind: 'module',
    });
    return;
  }
  if (data.type === 'prepare') {
    scope.postMessage({ id, ready: true });
    return;
  }
  try {
    const imageData = await decodeHeicPixels(libheif, data.buffer);

    scope.postMessage({ id, imageData });
  } catch (error) {
    scope.postMessage({
      id,
      error: error instanceof Error ? error.message : 'Wasm HEIC 디코딩에 실패했습니다.',
    });
  }
};
