import { describe, expect, it, vi } from 'vitest';

import { makePlaceMarkerContent } from './placeMapMarker';

const place = {
  id: 1,
  name: '제주시',
  latitude: 33.5,
  longitude: 126.5,
  photoCount: 42,
  thumbnailUrl: 'https://cdn.test/1',
};

describe('makePlaceMarkerContent', () => {
  it('대표 사진이 로드되기 전에는 스켈레톤을 보여주고 클릭하면 장소를 연다', () => {
    const onClick = vi.fn();
    const marker = makePlaceMarkerContent(place, onClick);
    const pin = marker.querySelector('.trip-map-pin')!;
    const image = marker.querySelector('img')!;

    expect(marker).toHaveAccessibleName('제주시 사진 42장 보기');
    expect(pin).toHaveClass('is-loading');
    expect(marker.querySelector('.trip-map-count')).toBeNull();
    expect(marker).toHaveTextContent('');

    image.dispatchEvent(new Event('load'));
    expect(pin).not.toHaveClass('is-loading');

    marker.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('대표 사진을 불러오지 못하면 기본 핀 배경만 남긴다', () => {
    const marker = makePlaceMarkerContent(place, vi.fn());

    marker.querySelector('img')!.dispatchEvent(new Event('error'));

    expect(marker.querySelector('img')).toBeNull();
    expect(marker.querySelector('.trip-map-pin')).not.toHaveClass('is-loading');
  });
});
