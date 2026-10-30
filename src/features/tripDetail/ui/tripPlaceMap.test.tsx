import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TripPlaceMarker } from '../model/types';
import { TripPlaceMap } from './tripPlaceMap';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
let onPlacesSelect: (places: TripPlaceMarker[], marker: HTMLElement) => void;
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('next/script', () => ({ default: () => null }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isError: false, refetch: vi.fn() }),
}));
vi.mock('@/queryFactory', () => ({ tripDetailQueries: { placeMap: vi.fn() } }));
vi.mock('../model/useKakaoPlaceMap', () => ({
  useKakaoPlaceMap: (options: { onPlacesSelect: typeof onPlacesSelect }) => {
    onPlacesSelect = options.onPlacesSelect;
    return {
      containerRef: { current: null },
      mapStatus: 'ready',
      onSdkReady: vi.fn(),
      onSdkError: vi.fn(),
    };
  },
}));

const places: TripPlaceMarker[] = [
  { id: 11, name: '서울역', latitude: 37.55, longitude: 126.97, photoCount: 3, thumbnailUrl: null },
  {
    id: 12,
    name: '역사 전시관',
    latitude: 37.55,
    longitude: 126.97,
    photoCount: 7,
    thumbnailUrl: null,
  },
];

describe('TripPlaceMap place selection', () => {
  beforeEach(() => push.mockReset());
  it('같은 좌표의 장소는 선택 팝오버에서 고른 장소로 이동한다', () => {
    render(<TripPlaceMap tripId={7} tripName="서울 여행" />);
    act(() => onPlacesSelect(places, document.createElement('button')));
    expect(screen.getByRole('dialog', { name: '장소 목록' })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '역사 전시관 사진 7장 보기' }));
    expect(push).toHaveBeenCalledWith(
      `/trips/7/places/12/photos?place=${encodeURIComponent('역사 전시관')}&trip=${encodeURIComponent('서울 여행')}`,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('단일 장소는 바로 이동하고 선택 팝오버을 띄우지 않는다', () => {
    render(<TripPlaceMap tripId={7} tripName="서울 여행" />);
    act(() => onPlacesSelect([places[0]], document.createElement('button')));
    expect(push).toHaveBeenCalledWith(
      `/trips/7/places/11/photos?place=${encodeURIComponent('서울역')}&trip=${encodeURIComponent('서울 여행')}`,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('팝오버을 닫으면 이동하지 않는다', () => {
    render(<TripPlaceMap tripId={7} tripName="서울 여행" />);
    act(() => onPlacesSelect(places, document.createElement('button')));
    fireEvent.click(screen.getByRole('button', { name: '장소 목록 닫기' }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('배경을 잠그지 않고 Escape로 닫으며 핀에 포커스를 돌린다', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    const originalOverflow = document.body.style.overflow;
    render(<TripPlaceMap tripId={7} tripName="서울 여행" />);
    act(() => onPlacesSelect(places, trigger));
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe(originalOverflow);
    expect(screen.getByRole('button', { name: '장소 목록 닫기' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('바깥 영역을 클릭하면 닫고 사진 목록으로 이동하지 않는다', () => {
    render(<TripPlaceMap tripId={7} tripName="서울 여행" />);
    act(() => onPlacesSelect(places, document.createElement('button')));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
  it('지도 가장자리 핀의 목록을 지도 영역 안에 배치한다', () => {
    render(<TripPlaceMap tripId={7} tripName="서울 여행" />);
    const mapElement = screen.getByRole('application', { name: '장소별 사진 지도' });
    vi.spyOn(mapElement, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      right: 330,
      bottom: 320,
      width: 320,
      height: 300,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });
    const trigger = document.createElement('button');
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      left: 300,
      top: 260,
      right: 372,
      bottom: 316,
      width: 72,
      height: 56,
      x: 300,
      y: 260,
      toJSON: () => ({}),
    });
    act(() => onPlacesSelect(places, trigger));
    const popup = screen.getByRole('dialog');
    expect(parseFloat(popup.style.left)).toBeGreaterThanOrEqual(8);
    expect(parseFloat(popup.style.left) + parseFloat(popup.style.width)).toBeLessThanOrEqual(312);
    expect(parseFloat(popup.style.top)).toBeGreaterThanOrEqual(8);
    expect(parseFloat(popup.style.top)).toBeLessThan(240);
  });
});
