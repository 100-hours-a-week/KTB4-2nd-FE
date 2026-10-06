export type HeicWasmRequest =
  | { id: number; buffer: ArrayBuffer; type?: never }
  | { id: number; type: 'prepare' };

export type HeicWasmResponse =
  | { id: number; imageData: ImageData; error?: never }
  | { id: number; ready: true; error?: never }
  | { id: number; error: string; imageData?: never; kind?: 'module' };
