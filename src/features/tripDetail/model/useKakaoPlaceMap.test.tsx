import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { KakaoLatLng, KakaoMap, KakaoMaps } from '@/features/mainMap/lib/kakaoMaps';
import type { TripPlaceMarker } from './types';
import { useKakaoPlaceMap } from './useKakaoPlaceMap';

const places: TripPlaceMarker[] = [
  {
    id: 1,
    name: '서울역',
    latitude: 37.55,
    longitude: 126.97,
    photoCount: 3,
    thumbnailUrl: 'https://example.test/1.jpg',
  },
  {
    id: 2,
    name: '남대문',
    latitude: 37.55001,
    longitude: 126.97001,
    photoCount: 5,
    thumbnailUrl: 'https://example.test/2.jpg',
  },
];

const map = {
  setBounds: vi.fn(),
  setCenter: vi.fn(),
  getCenter: vi.fn((): KakaoLatLng => ({ getLat: () => 37.55, getLng: () => 126.97 })),
  setLevel: vi.fn(),
  getLevel: vi.fn(() => 6),
  setMinLevel: vi.fn(),
  setMaxLevel: vi.fn(),
  relayout: vi.fn(),
  getProjection: vi.fn(() => ({ containerPointFromCoords: () => ({ x: 0, y: 0 }) })),
} satisfies KakaoMap;
let container: HTMLElement;

function Example({
  onSelect,
  inputPlaces = places,
  onGroup = () => {},
}: {
  onSelect: (place: TripPlaceMarker) => void;
  inputPlaces?: TripPlaceMarker[];
  onGroup?: (places: TripPlaceMarker[]) => void;
}) {
  const { containerRef, onSdkReady } = useKakaoPlaceMap({
    places: inputPlaces,
    onPlacesSelect: (group) => {
      if (group.length === 1) onSelect(group[0]);
      else onGroup(group);
    },
  });
  return (
    <>
      <div ref={containerRef} aria-label="장소 지도" />
      <button onClick={onSdkReady}>지도 준비</button>
    </>
  );
}

describe('useKakaoPlaceMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    window.kakao = {
      maps: {
        load: (callback) => callback(),
        LatLng: class {
          constructor(
            private lat: number,
            private lng: number,
          ) {}
          getLat() {
            return this.lat;
          }
          getLng() {
            return this.lng;
          }
        },
        LatLngBounds: class {
          extend() {}
        },
        Map: class {
          constructor(element: HTMLElement) {
            container = element;
            return map;
          }
        } as unknown as KakaoMaps['Map'],
        CustomOverlay: class {
          content: HTMLElement;
          constructor({ content }: { content: HTMLElement }) {
            this.content = content;
            container.append(content);
          }
          setMap() {
            this.content.remove();
          }
        },
        event: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    };
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.kakao;
  });

  it('좌표가 완전히 같은 장소는 숫자 핀으로 표시하고 전체 선택지를 전달한다', async () => {
    const samePosition = [
      places[0],
      { ...places[1], latitude: places[0].latitude, longitude: places[0].longitude },
    ];
    const onSelect = vi.fn();
    const onGroup = vi.fn();
    render(<Example onSelect={onSelect} onGroup={onGroup} inputPlaces={samePosition} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 준비' }));
    const marker = await screen.findByRole('button', { name: '같은 위치의 장소 2곳 보기' });
    expect(marker.querySelector('.trip-map-count')).toHaveTextContent('2');
    fireEvent.click(marker);
    expect(onGroup).toHaveBeenCalledWith(samePosition);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('가까운 장소도 각각의 핀을 만들고 선택한 장소를 전달한다', async () => {
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 준비' }));
    const first = await screen.findByRole('button', { name: '서울역 사진 3장 보기' });
    const second = screen.getByRole('button', { name: '남대문 사진 5장 보기' });
    expect(first.querySelector('img')).toHaveAttribute('src', places[0].thumbnailUrl);
    expect(second.querySelector('img')).toHaveAttribute('src', places[1].thumbnailUrl);
    fireEvent.click(first);
    fireEvent.click(second);
    expect(onSelect).toHaveBeenNthCalledWith(1, places[0]);
    expect(onSelect).toHaveBeenNthCalledWith(2, places[1]);
    await waitFor(() => expect(screen.getAllByRole('button')).toHaveLength(3));
  });
});
