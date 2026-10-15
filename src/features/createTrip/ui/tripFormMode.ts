import { createContext } from 'react';

/** 여행 만들기와 수정이 같은 단계 화면을 쓰므로, 헤더 문구처럼 달라지는 부분만 이 값으로 나눕니다. */
export type TripFormMode = 'create' | 'edit';

export const TripFormModeContext = createContext<TripFormMode>('create');
