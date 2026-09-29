import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mapConstructor } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY = 'test-map-key';
  return { mapConstructor: vi.fn() };
});

vi.mock('next/script', () => ({
  default: ({ onReady }: { onReady?: () => void }) => (
    <button type="button" onClick={onReady}>
      지도 SDK 준비
    </button>
  ),
}));

vi.mock('@/shared/ui/toast', () => ({
  toast: { error: vi.fn() },
}));

import { MainMap } from './mainMap';
import type { KakaoMaps } from '../lib/kakaoMaps';

let containerWidth = 430;
let containerHeight = 932;
let resizeCallback: ResizeObserverCallback | null = null;

const map = {
  setBounds: vi.fn(),
  setCenter: vi.fn(),
  getCenter: vi.fn(() => ({ getLat: () => 35.85, getLng: () => 128.2 })),
  setLevel: vi.fn(),
  getLevel: vi.fn(() => 12),
  setMinLevel: vi.fn(),
  setMaxLevel: vi.fn(),
  relayout: vi.fn(),
  getProjection: vi.fn(() => ({
    containerPointFromCoords: () => ({ x: 0, y: 0 }),
  })),
};

class ResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }

  observe() {}

  disconnect() {}
}

describe('MainMap', () => {
  beforeEach(() => {
    containerWidth = 430;
    containerHeight = 932;
    resizeCallback = null;
    mapConstructor.mockReset();
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => containerWidth);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
      () => containerHeight,
    );

    window.kakao = {
      maps: {
        load: (callback) => callback(),
        LatLng: class {
          getLat() {
            return 0;
          }

          getLng() {
            return 0;
          }
        },
        LatLngBounds: class {
          extend() {}
        },
        Map: class {
          constructor(container: HTMLElement) {
            mapConstructor(container.childElementCount);
            return map;
          }
        } as unknown as KakaoMaps['Map'],
        CustomOverlay: class {
          setMap() {}
        },
        event: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete window.kakao;
  });

  it('이전 지도 DOM을 비운 뒤 카카오 지도를 다시 생성한다', () => {
    render(<MainMap trips={[]} onTripSelect={vi.fn()} />);
    const container = screen.getByRole('application', { name: '카카오 지도' });
    container.append(document.createElement('div'));

    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));

    expect(mapConstructor).toHaveBeenCalledWith(0);
  });

  it('화면 전환으로 지도 영역이 0이 되면 relayout하지 않는다', () => {
    render(<MainMap trips={[]} onTripSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    map.relayout.mockClear();

    containerWidth = 0;
    containerHeight = 0;
    resizeCallback?.([], {} as ResizeObserver);

    expect(map.relayout).not.toHaveBeenCalled();
  });
});
