'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { createTripQueries } from '@/queryFactory';
import { Funnel } from '@/shared/lib/funnel';
import { toast } from '@/shared/ui/toast';

import { getTripCreateSubmitError } from '../model/submitError';
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
  const methods = useForm<TripCreateFormValues>({
    defaultValues: TRIP_CREATE_DEFAULT_VALUES,
    mode: 'onChange',
  });
  const { step, goToStep, replaceStep, goBack } = useTripCreateFunnel(initialStep);
  const submit = useTripCreateSubmit();
  const { resetCreatedTrip } = submit;

  const isAnalyzing = submit.isPending && submit.tripId !== null && submit.uploadRatio >= 1;
  const processingStatus = useQuery({
    ...createTripQueries.processingStatus(submit.tripId ?? 0),
    enabled: isAnalyzing,
  });

  useEffect(() => {
    const accessibleStep = getAccessibleTripCreateStep(step, methods.getValues());
    if (accessibleStep !== step) replaceStep(accessibleStep);
  }, [methods, replaceStep, step]);

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
      router.push('/');
      return;
    }
    goBack();
  };

  const completeForm = (values: TripCreateFormValues) => {
    submit.mutate(values, {
      onSuccess: () => {
        toast.success('여행을 만들었어요.');
        router.replace('/');
      },
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
        processingStatus={isAnalyzing ? processingStatus.data : undefined}
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleFormSubmit} noValidate>
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
