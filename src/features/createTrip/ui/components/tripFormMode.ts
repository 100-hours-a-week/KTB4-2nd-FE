import { createContext, type ReactNode } from 'react';

/** 여행 만들기와 수정이 같은 단계 화면을 쓰므로, 헤더 문구처럼 달라지는 부분만 이 값으로 나눕니다. */
export type TripFormMode = 'create' | 'edit';

export const TripFormModeContext = createContext<TripFormMode>('create');

/** 수정 화면에서 헤더 바로 아래에 붙는 접속자 표시처럼, 모든 단계에 같이 보일 내용을 넣습니다. */
export const TripFormHeaderSlotContext = createContext<ReactNode>(null);
