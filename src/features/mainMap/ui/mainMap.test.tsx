import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
let mapContainer: HTMLElement;

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
            mapContainer = container;
            mapConstructor(container.childElementCount);
            return map;
          }
        } as unknown as KakaoMaps['Map'],
        CustomOverlay: class {
          content: HTMLElement;

          constructor({ content }: { content: HTMLElement }) {
            this.content = content;
            mapContainer.append(content);
          }

          setMap() {
            this.content.remove();
          }
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

  it.each(['닫기 버튼', 'Escape'])(
    '%s으로 여행 목록을 닫고 마커로 포커스를 돌려준다',
    async (method) => {
      const user = userEvent.setup();
      const onTripSelect = vi.fn();
      render(
        <MainMap
          trips={[
            {
              regionCode: '11000',
              regionName: '서울',
              latitude: 37.56,
              longitude: 126.97,
              tripCount: 2,
              trips: [
                { tripId: 1, tripName: '서울 여행', thumbnailUrl: null, attachmentCount: 0 },
                { tripId: 2, tripName: '가을 여행', thumbnailUrl: null, attachmentCount: 0 },
              ],
            },
          ]}
          onTripSelect={onTripSelect}
        />,
      );
      await user.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
      const marker = screen.getByRole('button', { name: '겹친 여행 2개 보기' });
      marker.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('dialog', { name: '여행 목록' })).toBeInTheDocument();
      const closeButton = screen.getByRole('button', { name: '여행 목록 닫기' });
      expect(closeButton).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: /서울 여행/ })).toHaveFocus();

      if (method === 'Escape') await user.keyboard('{Escape}');
      else await user.click(closeButton);

      expect(screen.queryByRole('dialog', { name: '여행 목록' })).not.toBeInTheDocument();
      expect(marker).toHaveFocus();
      expect(onTripSelect).not.toHaveBeenCalled();
    },
  );
});
