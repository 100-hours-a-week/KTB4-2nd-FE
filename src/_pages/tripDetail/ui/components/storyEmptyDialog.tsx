import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { DocumentIcon } from '@/shared/ui/icons';

export function StoryEmptyDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<DocumentIcon size="19" variant="story" />}
      title="아직 스토리가 없어요"
      description={
        <>
          모든 사진과 분위기를 바탕으로
          <br />
          여행 스토리를 자동으로 만들어드릴게요.
        </>
      }
    >
      <div className="flex flex-col gap-1">
        <Button onClick={onCreate} className="min-h-11 w-full px-0 text-sm">
          스토리 만들기
        </Button>
        <Button
          variant="ghost"
          onClick={onClose}
          className="min-h-10 w-full px-0 text-[13px] font-medium"
        >
          나중에 할게요
        </Button>
      </div>
    </Dialog>
  );
}
