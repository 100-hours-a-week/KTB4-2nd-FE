import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { DocumentIcon } from '@/shared/ui/icons';

export function StoryEmptyDialog({
  open,
  onClose,
  onCreate,
  canCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  canCreate: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<DocumentIcon size="19" variant="story" />}
      title="아직 스토리가 없어요"
      description={
        canCreate ? (
          <>
            모든 사진과 분위기를 바탕으로
            <br />
            여행 스토리를 자동으로 만들어드릴게요.
          </>
        ) : (
          '여행을 만든 사람이 스토리를 만들면 여기에서 볼 수 있어요.'
        )
      }
    >
      <div className="flex flex-col gap-1">
        {canCreate && (
          <Button onClick={onCreate} className="w-full">
            스토리 만들기
          </Button>
        )}
        <Button variant="ghost" onClick={onClose} className="w-full">
          {canCreate ? '나중에 할게요' : '닫기'}
        </Button>
      </div>
    </Dialog>
  );
}
