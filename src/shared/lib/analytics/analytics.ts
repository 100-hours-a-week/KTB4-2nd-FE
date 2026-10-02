'use client';

import { sendGAEvent } from '@next/third-parties/google';

export const EVENTS = {
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  TRIP_CREATE: 'trip_create',
  PHOTO_UPLOAD_START: 'photo_upload_start',
  PHOTO_UPLOAD_COMPLETE: 'photo_upload_complete',
  LOCATION_RESTORE_COMPLETE: 'location_restore_complete',
  DIARY_GENERATE_REQUEST: 'diary_generate_request',
  DIARY_GENERATE_COMPLETE: 'diary_generate_complete',
  DIARY_GENERATE_FAIL: 'diary_generate_fail',
  DIARY_EDIT: 'diary_edit',
  SHARE: 'share',
} as const;

type AnalyticsEventParams = {
  sign_up: { method: 'kakao' };
  login: { method: 'kakao' };
  trip_create: { trip_region: string };
  photo_upload_start: { photo_count: number };
  photo_upload_complete: {
    photo_count: number;
    upload_duration_sec: number;
    camera_photo_count?: number;
    upload_source?: 'phone' | 'camera' | 'mixed';
  };
  location_restore_complete: {
    photo_count: number;
    restored_count: number;
    failed_count: number;
  };
  diary_generate_request: { photo_count: number };
  diary_generate_complete: { generation_time_sec: number; photo_count: number };
  diary_generate_fail: { error_type: string };
  diary_edit: Record<string, never>;
  share: { method: 'kakaotalk' | 'link_copy'; content_type: 'diary' };
};

type AnalyticsEventName = keyof AnalyticsEventParams;

declare global {
  interface Window {
    clarity?: (command: string, ...args: unknown[]) => void;
  }
}

function isEnabled() {
  return (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true' &&
    typeof window !== 'undefined'
  );
}

export function track<EventName extends AnalyticsEventName>(
  name: EventName,
  params: AnalyticsEventParams[EventName],
) {
  if (!isEnabled()) return;

  sendGAEvent('event', name, params);
  window.clarity?.('event', name);
}

export function identify(userId: number | string, userProps: Record<string, string> = {}) {
  if (!isEnabled()) return;

  const id = String(userId);
  sendGAEvent('set', { user_id: id });
  sendGAEvent('set', 'user_properties', userProps);
  window.clarity?.('identify', id);
}

export function clearIdentity() {
  if (!isEnabled()) return;

  sendGAEvent('set', { user_id: null });
}

export function setClarityTag(key: string, value: string | number | boolean) {
  if (!isEnabled()) return;

  window.clarity?.('set', key, String(value));
}
