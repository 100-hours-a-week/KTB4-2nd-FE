import { useCallback, useEffect, useRef, useState, type UIEvent } from 'react';

import type { TripMarkerGroup } from './tripMapMarker';

const MARKER_POPUP_GAP = 8;
const MARKER_POPUP_MAX_HEIGHT = 232;
const POPUP_PAGE_SIZE = 5;

export type OpenTripMarkerGroup = {
  group: TripMarkerGroup;
  x: number;
  y: number;
  placement: 'above' | 'below';
};

function markerVisualBounds(marker: HTMLElement) {
  const markerRect = marker.getBoundingClientRect();
  const pinRect = marker.querySelector('.trip-map-pin')?.getBoundingClientRect();
  return {
    top: Math.min(markerRect.top, pinRect?.top ?? markerRect.top),
    bottom: Math.max(markerRect.bottom, pinRect?.bottom ?? markerRect.bottom),
  };
}

export function useTripMarkerPopup() {
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [openGroup, setOpenGroup] = useState<OpenTripMarkerGroup | null>(null);
  const [visibleCount, setVisibleCount] = useState(POPUP_PAGE_SIZE);

  const dismissPopup = useCallback(() => setOpenGroup(null), []);
  const closePopup = useCallback(() => {
    setOpenGroup(null);
    if (triggerRef.current?.isConnected) triggerRef.current.focus();
  }, []);
  const openPopup = useCallback(
    (
      group: TripMarkerGroup,
      point: { x: number; y: number },
      marker: HTMLElement,
      container: HTMLElement,
    ) => {
      const containerTop = container.getBoundingClientRect().top;
      const bounds = markerVisualBounds(marker);
      const markerTop = bounds.top - containerTop;
      const markerBottom = bounds.bottom - containerTop;
      const placeBelow = markerTop < MARKER_POPUP_MAX_HEIGHT + MARKER_POPUP_GAP;
      triggerRef.current = marker;
      setVisibleCount(POPUP_PAGE_SIZE);
      setOpenGroup({
        group,
        x: Math.min(Math.max(point.x, 104), container.clientWidth - 104),
        y: placeBelow ? markerBottom + MARKER_POPUP_GAP : markerTop - MARKER_POPUP_GAP,
        placement: placeBelow ? 'below' : 'above',
      });
    },
    [],
  );
  useEffect(() => {
    if (!openGroup) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closePopup();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openGroup, closePopup]);

  const handleListScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 24)
      setVisibleCount((count) => count + POPUP_PAGE_SIZE);
  }, []);
  return {
    openGroup,
    visibleCount,
    closeButtonRef,
    openPopup,
    dismissPopup,
    closePopup,
    handleListScroll,
  };
}
