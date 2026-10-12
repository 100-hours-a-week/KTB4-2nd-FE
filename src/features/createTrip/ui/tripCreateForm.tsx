'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Funnel } from '@/shared/lib/funnel';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { toast } from '@/shared/ui/toast';

import { getTripCreateSubmitError } from '../model/submitError';
import { hasAnyPhotoLocation } from '../model/hasAnyPhotoLocation';
import { getTripCreateSubmitOutcome } from '../model/submitOutcome';
import {
  clearTripCreateDraft,
  readTripCreateDraft,
  saveTripCreateDraft,
} from '../model/tripCreateDraft';
import {
  TRIP_CREATE_DEFAULT_VALUES,
  type TripCreateFormValues,
  type TripCreateStep,
} from '../model/types';
import { useTripCreateFunnel } from '../model/useTripCreateFunnel';
import { useTripCreateSubmit } from '../model/useTripCreateSubmit';
import { getAccessibleTripCreateStep } from '../model/validation';
import { TripDateStep } from './tripDateStep';
import { TripImageStep } from './tripImageStep';
import { TripLocationStep } from './tripLocationStep';
import { TripNameStep } from './tripNameStep';
import { TripProcessingView } from './tripProcessingView';

type TripCreateFormProps = {
  initialStep: TripCreateStep;
};

export function TripCreateForm({ initialStep }: TripCreateFormProps) {
  const router = useRouter();
  const draftRestored = useRef(false);
  const methods = useForm<TripCreateFormValues>({
    defaultValues: TRIP_CREATE_DEFAULT_VALUES,
    mode: 'onChange',
  });
  const { step, goToStep, replaceStep, goBack } = useTripCreateFunnel(initialStep);
  const submit = useTripCreateSubmit();
  const { resetCreatedTrip } = submit;
  const handledResult = useRef<typeof submit.processingResult>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [locationWarningOpen, setLocationWarningOpen] = useState(false);
  const locationCheck = useRef<AbortController | null>(null);

  useEffect(() => () => locationCheck.current?.abort(), []);

  useEffect(() => {
    const result = submit.processingResult;
    if (!result || handledResult.current === result) return;
    handledResult.current = result;

    const outcome = getTripCreateSubmitOutcome(result);
    if (outcome.kind === 'completed' || outcome.kind === 'canceled') {
      clearTripCreateDraft();
      if (outcome.kind === 'completed') toast.success(outcome.message);
      else toast.warning(outcome.message);
      router.replace(outcome.redirectTo);
      return;
    }
    toast.error(outcome.message);
  }, [router, submit.processingResult]);

  useEffect(() => {
    methods.reset(readTripCreateDraft());
    draftRestored.current = true;
  }, [methods]);

  useEffect(() => {
    if (!draftRestored.current) return;

    const accessibleStep = getAccessibleTripCreateStep(step, methods.getValues());
    if (accessibleStep !== step) replaceStep(accessibleStep);
  }, [methods, replaceStep, step]);

  useEffect(() => {
    if (!draftRestored.current) return;

    return methods.subscribe({
      name: ['tripName', 'places', 'startDate', 'endDate'],
      formState: { values: true },
      callback: () => saveTripCreateDraft(methods.getValues()),
    });
  }, [methods]);

  useEffect(() => {
    return methods.subscribe({
      name: ['tripName', 'places', 'startDate', 'endDate'],
      formState: { values: true },
      callback: resetCreatedTrip,
    });
  }, [methods, resetCreatedTrip]);

  useEffect(() => {
    if (!submit.isPending) return;

    const preventLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', preventLeave);
    return () => window.removeEventListener('beforeunload', preventLeave);
  }, [submit.isPending]);

  const handleBack = (currentStep: TripCreateStep) => {
    if (currentStep === 'name') {
      clearTripCreateDraft();
      if (window.history.length > 1) router.back();
      else router.push('/');
      return;
    }
    goBack();
  };

  const completeForm = async (values: TripCreateFormValues) => {
    if (locationCheck.current || submit.isPending) return;
    const controller = new AbortController();
    locationCheck.current = controller;
    setIsCheckingLocation(true);

    try {
      const hasLocation = await hasAnyPhotoLocation(values.attachments);
      if (controller.signal.aborted) return;
      if (!hasLocation) {
        setLocationWarningOpen(true);
        return;
      }
    } catch {
      if (!controller.signal.aborted) {
        toast.error('사진의 위치 정보를 확인하지 못했어요. 다시 시도해주세요.');
      }
      return;
    } finally {
      locationCheck.current = null;
      if (!controller.signal.aborted) setIsCheckingLocation(false);
    }

    submit.mutate(values, {
      onError: (error) => {
        const { message, step: stepToFix, resetTrip } = getTripCreateSubmitError(error);

        toast.error(message);
        if (resetTrip) resetCreatedTrip();
        if (stepToFix && stepToFix !== step) goToStep(stepToFix);
      },
    });
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (step !== 'images') {
      event.preventDefault();
      return;
    }
    void methods.handleSubmit(completeForm)(event);
  };

  if (submit.isPending) {
    return (
      <TripProcessingView
        uploadRatio={submit.uploadRatio}
        processingStatus={submit.uploadRatio >= 1 ? submit.processingStatus : undefined}
        onCancel={submit.cancelProcessing}
        onContinueElsewhere={() => router.replace('/')}
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <form className="h-full overflow-hidden" onSubmit={handleFormSubmit} noValidate>
        <fieldset disabled={isCheckingLocation} className="h-full min-w-0 border-0 p-0">
          <Funnel step={step}>
            <Funnel.Step name="name">
              <TripNameStep onBack={() => handleBack('name')} onNext={() => goToStep('location')} />
            </Funnel.Step>
            <Funnel.Step name="location">
              <TripLocationStep
                onBack={() => handleBack('location')}
                onNext={() => goToStep('date')}
              />
            </Funnel.Step>
            <Funnel.Step name="date">
              <TripDateStep onBack={() => handleBack('date')} onNext={() => goToStep('images')} />
            </Funnel.Step>
            <Funnel.Step name="images">
              <TripImageStep
                onBack={() => handleBack('images')}
                isCheckingLocation={isCheckingLocation}
              />
            </Funnel.Step>
          </Funnel>
        </fieldset>
      </form>
      <Dialog
        open={locationWarningOpen}
        onClose={() => setLocationWarningOpen(false)}
        title="모든 사진에 위치 정보가 없어요"
        description="장소별로 여행 폴더를 나누려면 사진의 위치 정보가 필요해요. 위치 정보가 포함된 사진을 한 장 이상 선택해주세요."
      >
        <Button type="button" className="w-full" onClick={() => setLocationWarningOpen(false)}>
          확인
        </Button>
      </Dialog>
    </FormProvider>
  );
}
