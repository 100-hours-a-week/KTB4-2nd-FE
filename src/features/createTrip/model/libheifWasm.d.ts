declare module 'libheif-js/libheif-wasm/libheif-bundle.mjs' {
  export interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(image: ImageData, callback: (result: ImageData | null) => void): void;
    free(): void;
  }

  export interface HeifDecoder {
    decoder: number | null;
    decode(buffer: ArrayBuffer): HeifImage[];
  }

  export interface LibheifModule {
    HeifDecoder: new () => HeifDecoder;
    heif_context_free(context: number): void;
  }

  export default function createLibheif(): LibheifModule | Promise<LibheifModule>;
}
