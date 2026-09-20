'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Funnel } from '@/shared/lib/funnel';
import { toast } from '@/shared/ui/toast';

import {
  TRIP_CREATE_DEFAULT_VALUES,
  type TripCreateFormValues,
  type TripCreateStep,
} from '../model/types';
import { useTripCreateFunnel } from '../model/useTripCreateFunnel';
import { getAccessibleTripCreateStep } from '../model/validation';
import { TripDateStep } from './tripDateStep';
import { TripImageStep } from './tripImageStep';
import { TripLocationStep } from './tripLocationStep';
import { TripNameStep } from './tripNameStep';

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

  useEffect(() => {
    const accessibleStep = getAccessibleTripCreateStep(step, methods.getValues());
    if (accessibleStep !== step) replaceStep(accessibleStep);
  }, [methods, replaceStep, step]);

  const handleBack = (currentStep: TripCreateStep) => {
    if (currentStep === 'name') {
      router.push('/');
      return;
    }
    goBack();
  };

  const completeForm = () => {
    toast.success('여행 정보 입력을 완료했어요.');
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(completeForm)} noValidate>
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
