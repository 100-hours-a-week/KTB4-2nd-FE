import type { StoryCreateStep } from '@/features/createStory';
import { Button } from '@/shared/ui/button';

type StoryCreateActionsProps = {
  step: StoryCreateStep;
  selectedCount: number;
  canProceed: boolean;
  isChecking: boolean;
  onProceed: () => void;
};

export function StoryCreateActions({
  step,
  selectedCount,
  canProceed,
  isChecking,
  onProceed,
}: StoryCreateActionsProps) {
  return (
    <footer className="bg-surface before:from-surface relative shrink-0 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:to-transparent">
      <Button
        size="lg"
        disabled={!canProceed}
        isLoading={step === 'folder' && isChecking}
        loadingText="AI 준비 확인 중…"
        onClick={onProceed}
        className="w-full"
      >
        {step === 'mood' ? '다음' : '생성'}{' '}
        {step === 'folder' && selectedCount > 0 && (
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded-full bg-white/20 text-[11px]"
          >
            {selectedCount}
          </span>
        )}
      </Button>
    </footer>
  );
}
