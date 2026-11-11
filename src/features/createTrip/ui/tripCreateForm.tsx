'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { invalidateTripData } from '@/queryFactory';
import { Funnel } from '@/shared/lib/funnel';
import { toast } from '@/shared/ui/toast';

import { getTripCreateSubmitError } from '../model/submitError';
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
import { TripDateStep } from './components/tripDateStep';
import { TripImageStep } from './components/tripImageStep';
import { TripLocationStep } from './components/tripLocationStep';
import { TripNameStep } from './components/tripNameStep';
import { TripProcessingView } from './components/tripProcessingView';

let pendingDraftClear: number | undefined;

type TripCreateFormProps = {
  initialStep: TripCreateStep;
};

export function TripCreateForm({ initialStep }: TripCreateFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const draftRestored = useRef(false);
  const methods = useForm<TripCreateFormValues>({
    defaultValues: TRIP_CREATE_DEFAULT_VALUES,
    mode: 'onChange',
  });
  const { step, goToStep, replaceStep, goBack } = useTripCreateFunnel(initialStep);
  const submit = useTripCreateSubmit();
  const { resetCreatedTrip } = submit;
  const handledResult = useRef<typeof submit.processingResult>(null);

  useEffect(() => {
    const result = submit.processingResult;
    if (!result || handledResult.current === result) return;
    handledResult.current = result;

    const outcome = getTripCreateSubmitOutcome(result);
    if (outcome.kind === 'completed' || outcome.kind === 'canceled') {
      clearTripCreateDraft();

      void invalidateTripData(queryClient);
      if (outcome.kind === 'completed') toast.success(outcome.message);
      else toast.warning(outcome.message);
      router.replace(outcome.redirectTo);
      return;
    }
    toast.error(outcome.message);
  }, [queryClient, router, submit.processingResult]);

  useEffect(() => {
    methods.reset(readTripCreateDraft());
    draftRestored.current = true;
  }, [methods]);

  useEffect(() => {
    window.clearTimeout(pendingDraftClear);
    return () => {
      pendingDraftClear = window.setTimeout(clearTripCreateDraft, 0);
    };
  }, []);

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
      name: ['tripName', 'places', 'startDate', 'endDate', 'attachments'],
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

  const completeForm = (values: TripCreateFormValues) => {
    if (submit.isPending) return;
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
        isCanceling={submit.isCanceling}
        onContinueElsewhere={() => router.replace('/')}
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <form className="h-full overflow-hidden" onSubmit={handleFormSubmit} noValidate>
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
            <TripImageStep onBack={() => handleBack('images')} />
          </Funnel.Step>
        </Funnel>
      </form>
    </FormProvider>
  );
}
