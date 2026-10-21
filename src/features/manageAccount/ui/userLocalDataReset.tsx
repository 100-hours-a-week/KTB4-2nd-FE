'use client';

import { useEffect } from 'react';

import { clearUserLocalData } from '../model/clearUserLocalData';

export function UserLocalDataReset() {
  useEffect(() => {
    clearUserLocalData();
  }, []);

  return null;
}
