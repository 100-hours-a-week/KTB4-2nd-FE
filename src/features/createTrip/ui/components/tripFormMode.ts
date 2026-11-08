import { createContext, type ReactNode } from 'react';

export type TripFormMode = 'create' | 'edit';

export const TripFormModeContext = createContext<TripFormMode>('create');

export const TripFormHeaderSlotContext = createContext<ReactNode>(null);
