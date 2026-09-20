import { Children, isValidElement, type PropsWithChildren, type ReactNode } from 'react';

export type FunnelStepProps = PropsWithChildren<{
  name: string;
}>;

export type FunnelProps = {
  step: string;
  children: ReactNode;
};

function FunnelRoot({ step, children }: FunnelProps) {
  const currentStep = Children.toArray(children).find(
    (child) => isValidElement<FunnelStepProps>(child) && child.props.name === step,
  );

  return currentStep ?? null;
}

function FunnelStep({ children }: FunnelStepProps) {
  return children;
}

export const Funnel = Object.assign(FunnelRoot, {
  Step: FunnelStep,
});
