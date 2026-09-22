export type KakaoLatLng = {
  getLat(): number;
  getLng(): number;
};

export type KakaoMap = {
  setBounds(
    bounds: KakaoLatLngBounds,
    top?: number,
    right?: number,
    bottom?: number,
    left?: number,
  ): void;
  setCenter(position: KakaoLatLng): void;
  getCenter(): KakaoLatLng;
  setLevel(level: number): void;
  getLevel(): number;
  setMinLevel(level: number): void;
  setMaxLevel(level: number): void;
  relayout(): void;
  getProjection(): { containerPointFromCoords(position: KakaoLatLng): { x: number; y: number } };
};

export type KakaoLatLngBounds = {
  extend(position: KakaoLatLng): void;
};

export type KakaoCustomOverlay = {
  setMap(map: KakaoMap | null): void;
};

export type KakaoMaps = {
  load(callback: () => void): void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  LatLngBounds: new (southWest?: KakaoLatLng, northEast?: KakaoLatLng) => KakaoLatLngBounds;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  CustomOverlay: new (options: {
    map: KakaoMap;
    position: KakaoLatLng;
    content: HTMLElement;
    clickable: boolean;
    xAnchor: number;
    yAnchor: number;
    zIndex?: number;
  }) => KakaoCustomOverlay;
  event: {
    addListener(target: KakaoMap, event: string, handler: () => void): void;
    removeListener(target: KakaoMap, event: string, handler: () => void): void;
  };
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}
