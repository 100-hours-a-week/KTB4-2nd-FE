import { describe, expect, it, vi } from 'vitest';

import { makePlaceMarkerContent, toPlaceMarkerGroup } from './placeMapMarker';

const place = {
  id: 1,
  name: '제주시',
  latitude: 33.5,
  longitude: 126.5,
  photoCount: 42,
  thumbnailUrl: 'https://cdn.test/1',
};

describe('toPlaceMarkerGroup', () => {
  it('겹친 장소는 사진이 가장 많은 장소를 대표로 삼는다', () => {
    const group = toPlaceMarkerGroup([
      { ...place, id: 2, name: '우도', photoCount: 28 },
      place,
      { ...place, id: 3, name: '성산일출봉', photoCount: 15 },
    ]);

    expect(group.lead.id).toBe(1);
  });
});

describe('makePlaceMarkerContent', () => {
  it('대표 사진이 로드되기 전에는 스켈레톤을 보여주고 클릭하면 장소를 연다', () => {
    const onClick = vi.fn();
    const marker = makePlaceMarkerContent(toPlaceMarkerGroup([place]), onClick);
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

  it('겹친 장소 핀에는 장소 수 배지를 붙이고 확대 안내를 읽어준다', () => {
    const marker = makePlaceMarkerContent(
      toPlaceMarkerGroup([place, { ...place, id: 2, name: '우도', photoCount: 28 }]),
      vi.fn(),
    );

    expect(marker).toHaveAccessibleName('제주시 외 1곳 확대해서 보기');
    expect(marker.querySelector('.trip-map-count')).toHaveTextContent('2');
  });

  it('대표 사진을 불러오지 못하면 기본 핀 배경만 남긴다', () => {
    const marker = makePlaceMarkerContent(toPlaceMarkerGroup([place]), vi.fn());

    marker.querySelector('img')!.dispatchEvent(new Event('error'));

    expect(marker.querySelector('img')).toBeNull();
    expect(marker.querySelector('.trip-map-pin')).not.toHaveClass('is-loading');
  });
});
