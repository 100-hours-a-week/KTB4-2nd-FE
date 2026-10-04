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

scope.onmessage = async ({ data: { id, buffer } }) => {
  try {
    const libheif = await loadLibheif();
    const imageData = await decodeHeicPixels(libheif, buffer);
    // Match heic-to's structured-clone communication for this decoder comparison.
    // Do not also change transfer, resize, or JPEG encoding in this experiment.
    scope.postMessage({ id, imageData });
  } catch (error) {
    scope.postMessage({
      id,
      error: error instanceof Error ? error.message : 'Wasm HEIC 디코딩에 실패했습니다.',
    });
  }
};
