'use client';

import { useCallback, useEffect, useState } from 'react';

import { isTripCreateStep, type TripCreateStep } from './types';

function readStep(fallback: TripCreateStep) {
  const queryStep = new URLSearchParams(window.location.search).get('step');
  return isTripCreateStep(queryStep) ? queryStep : fallback;
}

function createStepUrl(step: TripCreateStep) {
  const url = new URL(window.location.href);
  url.searchParams.set('step', step);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function useTripCreateFunnel(initialStep: TripCreateStep) {
  const [step, setStep] = useState(() =>
    typeof window === 'undefined' ? initialStep : readStep(initialStep),
  );

  useEffect(() => {
    const handlePopState = () => setStep(readStep(initialStep));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialStep]);

  const goToStep = useCallback((nextStep: TripCreateStep) => {
    window.history.pushState(null, '', createStepUrl(nextStep));
    setStep(nextStep);
  }, []);

  const replaceStep = useCallback((nextStep: TripCreateStep) => {
    window.history.replaceState(null, '', createStepUrl(nextStep));
    setStep(nextStep);
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return { step, goToStep, replaceStep, goBack };
}
