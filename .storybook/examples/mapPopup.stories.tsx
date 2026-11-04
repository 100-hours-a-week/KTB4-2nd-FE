import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { fn } from 'storybook/test';

import { useTripMarkerPopup } from '@/features/mainMap/model/useTripMarkerPopup';
import type { TripMarkerGroup } from '@/features/mainMap/model/tripMapMarker';
import { TripMarkerPopup } from '@/features/mainMap/ui/tripMarkerPopup';
import { Button } from '@/shared/ui/button';

type ExampleArgs = {
  initialOpen: boolean;
  tripCount: number;
  onTripSelect: (tripId: number) => void;
};

function MapPopupExample({ initialOpen, tripCount, onTripSelect }: ExampleArgs) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLButtonElement>(null);
  const {
    openGroup,
    visibleCount,
    closeButtonRef,
    openPopup,
    closePopup,
    dismissPopup,
    handleListScroll,
  } = useTripMarkerPopup();
  const group = useMemo<TripMarkerGroup>(
    () => ({
      markers: [],
      latitude: 0,
      longitude: 0,
      regionName: '샘플 위치',
      tripCount,
      trips: Array.from({ length: tripCount }, (_, index) => ({
        tripId: index + 1,
        tripName: `샘플 여행 ${index + 1}`,
        thumbnailUrl: null,
        attachmentCount: 3,
      })),
    }),
    [tripCount],
  );
  const showPopup = useCallback(() => {
    const container = containerRef.current;
    const marker = markerRef.current;
    if (!container || !marker) return;
    const bounds = container.getBoundingClientRect();
    const pin = marker.getBoundingClientRect();
    openPopup(
      group,
      { x: pin.left + pin.width / 2 - bounds.left, y: pin.bottom - bounds.top },
      marker,
      container,
    );
  }, [group, openPopup]);
  useEffect(() => {
    if (initialOpen) showPopup();
  }, [initialOpen, showPopup]);
  return (
    <div className="mx-auto w-full max-w-[430px] p-6 text-brand">
      <p className="text-description text-muted mb-4">
        샘플 핀을 눌러 여행 목록을 열어보세요. 닫기와 Escape는 핀으로 포커스를 돌려줍니다.
      </p>
      <div
        ref={containerRef}
        className="bg-surface-subtle border-border-subtle relative h-[440px] rounded-card border"
      >
        <Button
          ref={markerRef}
          onClick={showPopup}
          className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          여행 핀 {tripCount}개
        </Button>
        {openGroup && (
          <TripMarkerPopup
            openGroup={openGroup}
            visibleCount={visibleCount}
            closeButtonRef={closeButtonRef}
            onClose={closePopup}
            onScroll={handleListScroll}
            onTripSelect={(id) => {
              onTripSelect(id);
              dismissPopup();
            }}
          />
        )}
      </div>
    </div>
  );
}

const meta = {
  title: 'Patterns/MapPopup',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '실제 여행 목록 팝업과 열기·닫기 훅을 사용합니다. 지도 영역은 샘플 배경이며 지도 SDK와 조회 API는 실행하지 않습니다. 여행 선택은 Actions에만 기록합니다.',
      },
    },
  },
  args: { initialOpen: true, tripCount: 3, onTripSelect: fn() },
  argTypes: { tripCount: { control: { type: 'number', min: 1, max: 20, step: 1 } } },
  render: (args) => <MapPopupExample {...args} />,
} satisfies Meta<ExampleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { name: '여행 목록 · 닫기와 포커스 복귀' };
export const Closed: Story = { name: '핀에서 열기', args: { initialOpen: false } };
export const ManyTrips: Story = { name: '여러 여행 · 목록 스크롤', args: { tripCount: 8 } };
