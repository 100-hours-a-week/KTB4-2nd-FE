export type HeicWasmRequest = { id: number; buffer: ArrayBuffer };

export type HeicWasmResponse =
  | { id: number; imageData: ImageData; error?: never }
  | { id: number; error: string; imageData?: never };
