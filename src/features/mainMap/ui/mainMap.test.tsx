import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mapConstructor } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY = 'test-map-key';
  return { mapConstructor: vi.fn() };
});

vi.mock('next/script', () => ({
  default: ({ onReady, onError }: { onReady?: () => void; onError?: () => void }) => (
    <>
      <button type="button" onClick={onReady}>
        지도 SDK 준비
      </button>
      <button type="button" onClick={onError}>
        지도 SDK 실패
      </button>
    </>
  ),
}));

vi.mock('@/shared/ui/toast', () => ({
  toast: { error: vi.fn() },
}));

import { forgetMapViewport, MainMap } from './mainMap';
import type { KakaoLatLng, KakaoMaps } from '../lib/kakaoMaps';
import type { TripMapMarker } from '../model/tripMapMarker';
import { toast } from '@/shared/ui/toast';

let containerWidth = 430;
let containerHeight = 932;
let resizeCallback: ResizeObserverCallback | null = null;
let mapContainer: HTMLElement;
let mapListeners: Map<string, () => void>;
const resizeDisconnect = vi.fn();

function tripMarker(count = 1): TripMapMarker {
  return {
    regionCode: '11000',
    regionName: '서울',
    latitude: 37.56,
    longitude: 126.97,
    tripCount: count,
    trips: Array.from({ length: count }, (_, index) => ({
      tripId: index + 1,
      tripName: `여행 ${index + 1}`,
      thumbnailUrl: null,
      attachmentCount: 0,
    })),
  };
}

const map = {
  setBounds: vi.fn(),
  setCenter: vi.fn(),
  getCenter: vi.fn((): KakaoLatLng => ({ getLat: () => 35.85, getLng: () => 128.2 })),
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

  disconnect() {
    resizeDisconnect();
  }
}

describe('MainMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    forgetMapViewport();
    map.getCenter.mockReturnValue({ getLat: () => 35.85, getLng: () => 128.2 });
    map.getLevel.mockReturnValue(12);
    mapListeners = new Map();
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
          constructor(
            private latitude: number,
            private longitude: number,
          ) {}
          getLat() {
            return this.latitude;
          }
          getLng() {
            return this.longitude;
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
          addListener: vi.fn((_, event, handler) => {
            mapListeners.set(event, handler);
          }),
          removeListener: vi.fn((_, event) => {
            mapListeners.delete(event);
          }),
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

  it('한 여행 마커는 바로 선택하고 콜백 변경 시 지도를 다시 만들지 않는다', () => {
    const trips = [tripMarker()];
    const firstSelect = vi.fn();
    const latestSelect = vi.fn();
    const { rerender } = render(<MainMap trips={trips} onTripSelect={firstSelect} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    rerender(<MainMap trips={trips} onTripSelect={latestSelect} />);
    fireEvent.click(screen.getByRole('button', { name: '여행 1 여행 보기' }));
    expect(latestSelect).toHaveBeenCalledExactlyOnceWith(1);
    expect(firstSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mapConstructor).toHaveBeenCalledOnce();
  });

  it('데이터가 변경되면 기존 마커를 제거하고 새 마커를 표시한다', () => {
    const { rerender } = render(<MainMap trips={[tripMarker()]} onTripSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    const previousMarker = screen.getByRole('button', { name: '여행 1 여행 보기' });
    const updated = tripMarker();
    updated.trips[0].tripName = '변경된 여행';
    rerender(<MainMap trips={[updated]} onTripSelect={vi.fn()} />);
    expect(previousMarker.isConnected).toBe(false);
    expect(screen.getByRole('button', { name: '변경된 여행 여행 보기' })).toBeInTheDocument();
    expect(mapConstructor).toHaveBeenCalledOnce();
  });

  it('팝업 목록은 다섯 개씩 추가 표시하고 다시 열면 초기화한다', () => {
    const onTripSelect = vi.fn();
    render(<MainMap trips={[tripMarker(12)]} onTripSelect={onTripSelect} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    const marker = screen.getByRole('button', { name: '겹친 여행 12개 보기' });
    fireEvent.click(marker);
    const dialog = screen.getByRole('dialog', { name: '여행 목록' });
    const list = screen.getByRole('button', { name: /여행 1 대표 이미지/ }).parentElement!;
    expect(within(dialog).getAllByRole('button')).toHaveLength(6);
    fireEvent.scroll(list, { target: { scrollTop: 1000 } });
    expect(within(dialog).getAllByRole('button')).toHaveLength(11);
    fireEvent.scroll(list, { target: { scrollTop: 1100 } });
    expect(within(dialog).getAllByRole('button')).toHaveLength(13);
    fireEvent.click(within(dialog).getByRole('button', { name: /여행 12 대표 이미지/ }));
    expect(onTripSelect).toHaveBeenCalledWith(12);
    fireEvent.click(screen.getByRole('button', { name: '여행 목록 닫기' }));
    fireEvent.click(marker);
    expect(within(screen.getByRole('dialog')).getAllByRole('button')).toHaveLength(6);
    expect(mapConstructor).toHaveBeenCalledOnce();
  });

  it.each(['click', 'idle'])('지도 %s 이벤트는 열린 팝업을 닫는다', (event) => {
    render(<MainMap trips={[tripMarker(2)]} onTripSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    fireEvent.click(screen.getByRole('button', { name: '겹친 여행 2개 보기' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => mapListeners.get(event)?.());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('초기화 신호는 지도를 재생성하지 않고 화면 범위와 팝업을 초기화한다', () => {
    const trips = [tripMarker(2)];
    const { rerender } = render(<MainMap trips={trips} onTripSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    fireEvent.click(screen.getByRole('button', { name: '겹친 여행 2개 보기' }));
    map.setCenter.mockClear();
    map.setLevel.mockClear();
    rerender(<MainMap trips={trips} onTripSelect={vi.fn()} resetSignal={1} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(map.setCenter).toHaveBeenCalledOnce();
    expect(map.setLevel).toHaveBeenCalledWith(13);
    expect(mapConstructor).toHaveBeenCalledOnce();
  });

  it('페이지 이탈 시 지도 이벤트와 observer, 프레임, 마커 DOM을 정리한다', () => {
    const { unmount } = render(<MainMap trips={[tripMarker()]} onTripSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    const container = screen.getByRole('application');
    unmount();
    expect(resizeDisconnect).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(window.kakao!.maps.event.removeListener).toHaveBeenCalledTimes(2);
    expect(mapListeners.size).toBe(0);
    expect(container.childElementCount).toBe(0);
  });

  it('페이지 이탈 뒤 늦게 SDK 준비가 완료돼도 지도를 생성하지 않는다', () => {
    let finishLoad!: () => void;
    window.kakao!.maps.load = (callback) => {
      finishLoad = callback;
    };
    const { unmount } = render(<MainMap trips={[]} onTripSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    unmount();
    act(() => finishLoad());
    expect(mapConstructor).not.toHaveBeenCalled();
  });

  it.each(['로드 실패', '준비 후 SDK 없음'])('SDK %s 시 오류 안내를 표시한다', (failure) => {
    render(<MainMap trips={[]} onTripSelect={vi.fn()} />);
    if (failure === '준비 후 SDK 없음') {
      delete window.kakao;
      fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    } else fireEvent.click(screen.getByRole('button', { name: '지도 SDK 실패' }));
    expect(
      screen.getByText('지도를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith('지도 로드에 실패했어요.');
  });

  it('사용자가 움직인 지도 위치와 확대 수준은 다시 진입했을 때 복원한다', () => {
    const trips = [tripMarker()];
    const first = render(<MainMap trips={trips} onTripSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    map.getCenter.mockReturnValue({ getLat: () => 37.57, getLng: () => 126.98 });
    map.getLevel.mockReturnValue(6);
    fireEvent.pointerDown(screen.getByRole('application'));
    act(() => mapListeners.get('idle')?.());
    first.unmount();
    map.setCenter.mockClear();
    map.setLevel.mockClear();
    render(<MainMap trips={trips} onTripSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '지도 SDK 준비' }));
    expect(map.setLevel).toHaveBeenCalledWith(6);
    const position = map.setCenter.mock.calls[0][0];
    expect(position.getLat()).toBe(37.57);
    expect(position.getLng()).toBe(126.98);
  });

  it('썸네일 미리 읽기는 데이터가 같으면 재사용하고 URL이 바뀌면 갱신한다', () => {
    const preload = vi.fn();
    vi.stubGlobal(
      'Image',
      class {
        decoding = '';
        src = '';
        constructor() {
          preload();
        }
      },
    );
    const trip = tripMarker();
    trip.trips[0].thumbnailUrl = 'https://example.com/refactor-preview.jpg';
    const { rerender } = render(<MainMap trips={[trip]} onTripSelect={vi.fn()} />);
    expect(preload).toHaveBeenCalledOnce();
    rerender(<MainMap trips={[{ ...trip }]} onTripSelect={vi.fn()} />);
    expect(preload).toHaveBeenCalledOnce();
    const updated = {
      ...trip,
      trips: [{ ...trip.trips[0], thumbnailUrl: 'https://example.com/updated-preview.jpg' }],
    };
    rerender(<MainMap trips={[updated]} onTripSelect={vi.fn()} />);
    expect(preload).toHaveBeenCalledTimes(2);
  });
});
