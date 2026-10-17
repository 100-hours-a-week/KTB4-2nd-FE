type HeaderView = {
  byteLength: number;
  getUint32: (offset: number) => number;
  getString: (offset: number, length: number) => string;
};

type HeicParser = {
  new (...args: unknown[]): object;
  canHandle: (file: HeaderView, marker: number) => boolean;
};

const registered = new WeakSet<HeicParser>();

/** exifr 7.1.3의 ftyp 50바이트 제한을 보완하고, 기존 EXIF 파싱은 그대로 사용합니다. */
export function registerHeicParser(fileParsers: Map<string, HeicParser>) {
  const OriginalParser = fileParsers.get('heic');
  if (!OriginalParser || registered.has(OriginalParser)) return;

  class CompatibleHeicParser extends OriginalParser {
    static canHandle(file: HeaderView): boolean {
      if (file.byteLength < 16 || file.getString(4, 4) !== 'ftyp') return false;

      const length = file.getUint32(0);
      // 브랜드는 4바이트 단위입니다. 선언한 박스가 읽은 데이터 범위를 넘으면 거부합니다.
      if (length < 16 || length > file.byteLength || (length - 16) % 4 !== 0) return false;

      if (file.getString(8, 4) === 'heic') return true;
      for (let offset = 16; offset < length; offset += 4) {
        if (file.getString(offset, 4) === 'heic') return true;
      }
      return false;
    }
  }

  fileParsers.set('heic', CompatibleHeicParser);
  registered.add(CompatibleHeicParser);
}
