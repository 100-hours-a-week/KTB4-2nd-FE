const INVISIBLE = '\\u115F\\u1160\\u3164\\uFFA0\\u2800\\u200B-\\u200D\\u2060\\uFEFF';
const EDGE_BLANK_PATTERN = new RegExp(`^[\\s${INVISIBLE}]+|[\\s${INVISIBLE}]+$`, 'g');
const INVISIBLE_PATTERN = new RegExp(`[\\s${INVISIBLE}]`, 'g');

const LONE_SURROGATE_PATTERN =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;


export function normalizeText(value: string) {
  return value.replace(LONE_SURROGATE_PATTERN, '').replace(EDGE_BLANK_PATTERN, '');
}

export function hasVisibleText(value: string) {
  return value.replace(INVISIBLE_PATTERN, '').length > 0;
}

export function countChars(value: string) {
  return Array.from(value).length;
}

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('ko', { granularity: 'grapheme' })
    : null;

export function sliceChars(value: string, max: number) {
  if (countChars(value) <= max) return value;

  const graphemes = segmenter
    ? Array.from(segmenter.segment(value), (part) => part.segment)
    : Array.from(value);
  let result = '';
  let count = 0;
  for (const grapheme of graphemes) {
    const size = countChars(grapheme);
    if (count + size > max) break;
    result += grapheme;
    count += size;
  }
  return result;
}
