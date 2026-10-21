'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import {
  createTripQueries,
  photoListQueries,
  tripDetailQueries,
  tripListQueries,
} from '@/queryFactory';
import { Funnel } from '@/shared/lib/funnel';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/pageHeader';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';

import type { TripEditData } from '../api/getTripForEdit';
import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';
import { getTripEditSubmitError } from '../model/editSubmitError';
import type { TripCreateFormValues, TripCreateStep } from '../model/types';
import { useTripCreateFunnel } from '../model/useTripCreateFunnel';
import { hasTripEditChanges, useTripEditSubmit } from '../model/useTripEditSubmit';
import { TripDateStep } from './components/tripDateStep';
import { TripEditImageStep } from './components/tripEditImageStep';
import { TripFormModeContext } from './components/tripFormMode';
import { TripLocationStep } from './components/tripLocationStep';
import { TripNameStep } from './components/tripNameStep';
import { TripProcessingView } from './components/tripProcessingView';

type TripEditFormProps = {
  tripId: number;
  initialStep: TripCreateStep;
};

export function TripEditForm({ tripId, initialStep }: TripEditFormProps) {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useQuery(createTripQueries.edit(tripId));

  return (
    <TripFormModeContext.Provider value="edit">
      {data ? (
        <TripEditFormContent data={data} initialStep={initialStep} />
      ) : (
        <main className="bg-surface text-brand mx-auto flex h-full min-h-0 w-full max-w-107.5 flex-col px-6 pt-[max(8px,env(safe-area-inset-top))]">
          <PageHeader
            title="여행 수정"
            backLabel="여행 상세로 돌아가기"
            onBack={() => router.replace(`/trips/${tripId}`)}
          />
          {isPending ? (
            <div role="status" aria-label="여행 정보 불러오는 중" className="mt-10 space-y-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            isError && (
              <section
                role="alert"
                className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
              >
                <p className="text-muted text-sm">여행 정보를 불러오지 못했어요.</p>
                <Button variant="secondary" onClick={() => void refetch()}>
                  다시 시도
                </Button>
              </section>
            )
          )}
        </main>
      )}
    </TripFormModeContext.Provider>
  );
}

function TripEditFormContent({
  data,
  initialStep,
}: {
  data: TripEditData;
  initialStep: TripCreateStep;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const tripPath = `/trips/${data.tripId}`;
  const methods = useForm<TripCreateFormValues>({
    defaultValues: {
      tripName: data.tripName,
      places: data.places,
      startDate: data.startDate,
      endDate: data.endDate,
      attachments: [],
    },
    mode: 'onChange',
  });
  const { step, goToStep, goBack } = useTripCreateFunnel(initialStep);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<Set<number>>(new Set());
  const [isAddingPhotos, setIsAddingPhotos] = useState(false);

  const finish = (status: TripProcessingStatusResponse | null) => {
    if (status?.status === 'FAILED') {
      toast.error('추가한 사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.');
    } else if (status?.status === 'CANCELED') {
      toast.warning('사진 추가가 취소됐어요.');
    } else {
      toast.success('여행을 수정했어요.');
    }
    // 이름·날짜·사진이 바뀌었으므로 목록, 지도, 장소 폴더를 새로 받습니다.
    void queryClient.invalidateQueries({ queryKey: tripDetailQueries.allKeys() });
    void queryClient.invalidateQueries({ queryKey: photoListQueries.allKeys() });
    void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
    void queryClient.invalidateQueries({ queryKey: ['mainMap'] });
    router.replace(tripPath);
    router.refresh();
  };
  const edit = useTripEditSubmit(data, finish);
  const isUploading = edit.isSaving && isAddingPhotos;

  useEffect(() => {
    if (!isUploading) return;

    const preventLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', preventLeave);
    return () => window.removeEventListener('beforeunload', preventLeave);
  }, [isUploading]);

  const handleBack = (currentStep: TripCreateStep) => {
    if (currentStep !== 'name') {
      goBack();
      return;
    }
    if (window.history.length > 1) router.back();
    else router.replace(tripPath);
  };

  const toggleRemovedPhoto = (photoId: number) => {
    setRemovedPhotoIds((current) => {
      const next = new Set(current);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const submitForm = (values: TripCreateFormValues) => {
    if (edit.isSaving) return;

    if (data.photos.length - removedPhotoIds.size + values.attachments.length === 0) {
      toast.error('사진을 한 장 이상 남겨주세요.');
      return;
    }

    const input = { values, removedPhotoIds: [...removedPhotoIds] };
    if (!hasTripEditChanges(data, input)) {
      toast.info('바뀐 내용이 없어요.');
      return;
    }

    setIsAddingPhotos(values.attachments.length > 0);
    edit.submit(input, {
      onError: (error) => {
        const { message, step: stepToFix, resetAddition } = getTripEditSubmitError(error);
        toast.error(message);
        if (resetAddition) edit.resetAddition();
        if (stepToFix && stepToFix !== step) goToStep(stepToFix);
      },
    });
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (step !== 'images') {
      event.preventDefault();
      return;
    }
    void methods.handleSubmit(submitForm)(event);
  };

  if (isUploading || edit.isProcessing) {
    return (
      <TripProcessingView
        uploadRatio={edit.uploadRatio}
        processingStatus={edit.uploadRatio >= 1 ? edit.processingStatus : undefined}
        onContinueElsewhere={() => router.replace(tripPath)}
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
            <TripEditImageStep
              existingPhotos={data.photos}
              removedPhotoIds={removedPhotoIds}
              onToggleRemove={toggleRemovedPhoto}
              onBack={() => handleBack('images')}
              isSubmitting={edit.isSaving}
            />
          </Funnel.Step>
        </Funnel>
      </form>
    </FormProvider>
  );
}
