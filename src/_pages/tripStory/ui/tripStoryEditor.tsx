'use client';

import { Fragment, useId, useState, type ChangeEvent } from 'react';

import { AiUnavailableDialog, useAiReadyGuard } from '@/features/aiStatus';
import { STORY_MOODS } from '@/features/createStory';
import {
  STORY_BLOCK_LIMIT,
  STORY_DAY_LABEL_LIMIT,
  STORY_DETAIL_SUMMARY_LIMIT,
  STORY_MEMO_LIMIT,
  STORY_SUMMARY_LIMIT,
  STORY_TONE_PREVIEW_MOODS,
  countStoryText,
  useTripStoryEdit,
  type StoryEditBlock,
  type TripStory,
  type TripStoryMood,
  type TripStoryResponse,
} from '@/features/tripStory';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import {
  CalendarIcon,
  CheckIcon,
  ImageIcon,
  ImageOffIcon,
  PlusIcon,
  TrashIcon,
} from '@/shared/ui/icons';
import { useLongPress } from '@/shared/lib/longPress';
import { PageHeader } from '@/shared/ui/pageHeader';
import { toast } from '@/shared/ui/toast';

import { StoryPhotoAddSheet } from './storyPhotoAddSheet';
import { StoryPhotoReplaceSheet } from './storyPhotoReplaceSheet';

const TONE_OPTIONS = STORY_MOODS.filter((mood) =>
  (STORY_TONE_PREVIEW_MOODS as readonly string[]).includes(mood.value),
);

const RETIRED_MOOD_LABELS: Partial<Record<TripStoryMood, string>> = {
  EMOTIONAL: '감성적으로',
  CALM: '차분하게',
};

function moodLabel(mood: TripStoryMood) {
  return (
    STORY_MOODS.find((option) => option.value === mood)?.label ?? RETIRED_MOOD_LABELS[mood] ?? mood
  );
}

export function TripStoryEditor({
  trip,
  story,
  onClose,
}: {
  trip: Pick<TripStory, 'tripId' | 'tripName' | 'startDate' | 'endDate' | 'photoCount'>;
  story: TripStoryResponse;
  onClose: () => void;
}) {
  const edit = useTripStoryEdit(trip.tripId, story, { onSaved: onClose });
  const aiGuard = useAiReadyGuard();
  const [toneOpen, setToneOpen] = useState(false);
  const [replacing, setReplacing] = useState<StoryEditBlock | null>(null);
  const [adding, setAdding] = useState<{ dayKey: string; index: number } | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const { draft } = edit;
  const blocks = draft.days.flatMap((day) => day.blocks);
  const blockCount = blocks.length;
  const usedAttachmentIds = new Set(blocks.map((block) => block.tripAttachmentId));
  const busy = edit.isSaving || edit.isChangingTone;
  const canAdd = !busy && blockCount < STORY_BLOCK_LIMIT;
  const addingDay = adding ? draft.days.find((day) => day.key === adding.dayKey) : undefined;

  function back() {
    if (busy) return;
    if (edit.isDirty) setDiscardOpen(true);
    else onClose();
  }
  function openReplace(block: StoryEditBlock) {
    if (busy) return;
    if (block.storyBlockId === null) {
      toast.info('새로 넣은 사진은 저장한 뒤에 비슷한 사진으로 바꿀 수 있어요.');
      return;
    }
    void aiGuard.runWhenAiReady(() => setReplacing(block));
  }
  function selectTone(tone: TripStoryMood) {
    setToneOpen(false);
    void aiGuard.runWhenAiReady(() => edit.changeTone(tone));
  }

  return (
    <main className="page-enter bg-surface text-brand mx-auto min-h-full w-full max-w-[430px] pb-10">
      <div className="border-border-subtle sticky top-0 z-20 border-b bg-white px-5 pt-[env(safe-area-inset-top)]">
        <PageHeader
          title="여행 스토리 편집"
          onBack={back}
          backLabel="편집 그만하기"
          action={
            <button
              type="button"
              onClick={() => {
                if (edit.submit()) return;
                // 저장을 막은 칸으로 바로 데려갑니다.
                document.querySelector<HTMLElement>('main [aria-invalid="true"]')?.focus();
              }}
              disabled={busy}
              aria-busy={edit.isSaving}
              className="focus-visible:outline-brand hover:bg-brand/5 -mr-2 flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-bold whitespace-nowrap disabled:opacity-40 focus-visible:outline-2"
            >
              <CheckIcon strokeWidth="2.2" size="16" aria-hidden="true" />
              {edit.isSaving ? '저장 중…' : '완료'}
            </button>
          }
        />
      </div>

      <section aria-label="여행 정보" className="px-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[23px] font-extrabold tracking-[-0.04em] wrap-break-word">
              {trip.tripName}
            </h2>
            <p className="text-muted mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon strokeWidth="1.7" size="14" /> {trip.startDate.replaceAll('-', '.')} –{' '}
                {trip.endDate.slice(5).replace('-', '.')}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon strokeWidth="1.7" size="14" variant="story" /> {trip.photoCount}장
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToneOpen(true)}
            disabled={busy || aiGuard.isChecking}
            aria-label={`글 분위기 바꾸기, 지금은 ${moodLabel(draft.mood)}`}
            className="bg-surface-subtle hover:bg-surface-subtle-hover focus-visible:outline-brand shrink-0 rounded-full px-4 py-2.5 text-xs font-bold disabled:opacity-50 focus-visible:outline-2"
          >
            {moodLabel(draft.mood)}
          </button>
        </div>

        <TextField
          label="스토리 한 줄 요약"
          value={draft.storySummary}
          limit={STORY_SUMMARY_LIMIT}
          onChange={edit.changeSummary}
          disabled={busy}
          required
          placeholder="여행을 한 줄로 요약해보세요"
          containerClassName="mt-5"
          className="text-[15px] font-semibold"
        />

        <p className="bg-surface-subtle text-muted mt-4 rounded-2xl px-4 py-3 text-xs leading-5">
          제목과 문장을 눌러 고치고, 사진을 길게 누르면 비슷한 사진으로 바꿀 수 있어요. 휴지통을
          누르면 사진을 빼요.
        </p>
      </section>

      {edit.isChangingTone && (
        <p role="status" className="text-muted px-5 pt-4 text-center text-xs font-semibold">
          새 분위기로 글을 다시 쓰고 있어요…
        </p>
      )}

      <div className={`px-5 pt-6 ${edit.isChangingTone ? 'pointer-events-none opacity-50' : ''}`}>
        {draft.days.map((day) => (
          <section
            key={day.key}
            aria-label={`${day.date} 스토리`}
            className="relative pb-7 last:pb-0"
          >
            <div
              aria-hidden="true"
              className="absolute top-8 bottom-0 left-[19px] w-px border-l border-dashed border-slate-300"
            />
            <div className="relative flex items-center gap-2.5">
              <span className="bg-brand shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold tabular-nums text-white">
                {day.date.slice(5).replace('-', '.')}
              </span>
              <TextField
                label={`${day.date.slice(5).replace('-', '.')} 날짜 제목`}
                value={day.dayLabel}
                limit={STORY_DAY_LABEL_LIMIT}
                onChange={(value) => edit.changeDayLabel(day.key, value)}
                disabled={busy}
                required
                placeholder="날짜 제목"
                className="text-[13px] font-bold"
              />
            </div>
            <ul className="mt-4">
              <AddPhotoSlot
                label={`${day.date.slice(5).replace('-', '.')} 맨 앞에 사진 추가`}
                disabled={!canAdd}
                onAdd={() => setAdding({ dayKey: day.key, index: 0 })}
              />
              {day.blocks.map((block, index) => (
                <Fragment key={block.key}>
                  <EditableStoryBlock
                    block={block}
                    label={`${day.date.slice(5).replace('-', '.')} ${index + 1}번째 사진`}
                    disabled={busy}
                    canRemove={blockCount > 1}
                    onChange={(patch) => edit.changeBlock(block.key, patch)}
                    onRemove={() => edit.removeBlock(block.key)}
                    onReplace={() => openReplace(block)}
                  />
                  <AddPhotoSlot
                    label={`${day.date.slice(5).replace('-', '.')} ${index + 1}번째 사진 뒤에 사진 추가`}
                    disabled={!canAdd}
                    onAdd={() => setAdding({ dayKey: day.key, index: index + 1 })}
                  />
                </Fragment>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Dialog
        open={toneOpen}
        onClose={() => setToneOpen(false)}
        title="글 분위기 바꾸기"
        description="고른 분위기로 지금 글을 다시 써요. 완료를 눌러야 저장돼요."
        size="wide"
      >
        <ul className="space-y-2 text-left">
          {TONE_OPTIONS.map((option) => {
            const selected = option.value === draft.mood;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => selectTone(option.value)}
                  disabled={selected}
                  aria-current={selected ? 'true' : undefined}
                  className={`focus-visible:outline-brand flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left focus-visible:outline-2 ${selected ? 'border-brand bg-brand/5' : 'border-border-subtle hover:bg-surface-subtle'}`}
                >
                  <span>
                    <span className="block text-sm font-bold">{option.label}</span>
                    <span className="text-muted mt-0.5 block text-xs">{option.description}</span>
                  </span>
                  {selected && <CheckIcon strokeWidth="2.2" size="16" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
        <Button variant="secondary" onClick={() => setToneOpen(false)} className="mt-4 w-full">
          닫기
        </Button>
      </Dialog>

      <StoryPhotoReplaceSheet
        tripId={trip.tripId}
        storyId={draft.storyId}
        block={replacing}
        usedAttachmentIds={usedAttachmentIds}
        onSelect={(photo) => {
          if (replacing) edit.replacePhoto(replacing.key, photo);
          setReplacing(null);
        }}
        onClose={() => setReplacing(null)}
      />

      <StoryPhotoAddSheet
        tripId={trip.tripId}
        placeIds={[...new Set(addingDay?.blocks.map((block) => block.tripPlaceId) ?? [])]}
        open={adding !== null && addingDay !== undefined}
        usedAttachmentIds={usedAttachmentIds}
        onSelect={(photo) => {
          if (adding) edit.addPhoto(adding.dayKey, adding.index, photo);
          setAdding(null);
        }}
        onClose={() => setAdding(null)}
      />

      <Dialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="편집을 그만할까요?"
        description="저장하지 않은 내용은 사라져요."
      >
        <DialogActions>
          <Button variant="secondary" onClick={onClose}>
            그만하기
          </Button>
          <Button onClick={() => setDiscardOpen(false)}>계속 편집</Button>
        </DialogActions>
      </Dialog>

      <AiUnavailableDialog
        reason={aiGuard.unavailableReason}
        onClose={aiGuard.closeUnavailableDialog}
      />
    </main>
  );
}

function AddPhotoSlot({
  label,
  disabled,
  onAdd,
}: {
  label: string;
  disabled: boolean;
  onAdd: () => void;
}) {
  return (
    <li className="py-2.5 pl-10">
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        aria-label={label}
        className="text-muted hover:text-brand hover:border-brand/40 focus-visible:outline-brand flex h-9 w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-xs font-semibold transition-colors disabled:opacity-40 focus-visible:outline-2"
      >
        <PlusIcon size="14" aria-hidden="true" />
        사진 추가
      </button>
    </li>
  );
}

function EditableStoryBlock({
  block,
  label,
  disabled,
  canRemove,
  onChange,
  onRemove,
  onReplace,
}: {
  block: StoryEditBlock;
  label: string;
  disabled: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<Pick<StoryEditBlock, 'detailSummary' | 'memo'>>) => void;
  onRemove: () => void;
  onReplace: () => void;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const unavailable = !block.thumbnailUrl || failedUrl === block.thumbnailUrl;
  const pressHandlers = useLongPress({
    onLongPress: onReplace,
    onClick: () => toast.info('사진을 길게 누르면 비슷한 사진으로 바꿀 수 있어요.'),
    disabled,
  });

  return (
    <li aria-label={label} className="relative pl-10">
      <span
        aria-hidden="true"
        className="absolute top-2 left-[14px] size-[11px] rounded-full border-2 border-slate-300 bg-white"
      />
      <TextField
        label={`${label} 제목`}
        value={block.detailSummary}
        limit={STORY_DETAIL_SUMMARY_LIMIT}
        onChange={(detailSummary) => onChange({ detailSummary })}
        disabled={disabled}
        required
        placeholder="사진 제목"
        containerClassName="mb-3"
        className="text-xs font-semibold"
      />
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-[18px] ${unavailable ? 'border border-dashed border-slate-300 bg-surface-subtle' : 'bg-slate-100'}`}
      >
        <button
          type="button"
          disabled={disabled}
          aria-label={`${label} 비슷한 사진으로 바꾸기`}
          aria-haspopup="dialog"
          {...pressHandlers}
          onKeyDown={(event) => {
            // 키보드로는 길게 누를 수 없어서 Enter·Space로 바로 엽니다.
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onReplace();
          }}
          onContextMenu={(event) => event.preventDefault()}
          className="focus-visible:outline-brand absolute inset-0 touch-manipulation select-none [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:-outline-offset-2"
        />
        {unavailable ? (
          <span className="text-muted pointer-events-none flex h-full flex-col items-center justify-center gap-3 text-xs">
            <ImageOffIcon strokeWidth="1.5" size="30" />
            사진을 불러오지 못했어요
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.thumbnailUrl!}
            alt=""
            width={320}
            height={320}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setFailedUrl(block.thumbnailUrl)}
            className="pointer-events-none size-full object-cover select-none"
          />
        )}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled || !canRemove}
          aria-label={`${label} 빼기`}
          title={canRemove ? undefined : '사진은 한 장 이상 남겨야 해요'}
          className="bg-brand/75 hover:bg-brand focus-visible:outline-brand absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-lg text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <TrashIcon size="18" aria-hidden="true" />
        </button>
      </div>
      <TextField
        label={`${label} 문장`}
        multiline
        value={block.memo}
        limit={STORY_MEMO_LIMIT}
        onChange={(memo) => onChange({ memo })}
        disabled={disabled}
        placeholder="이 사진에 대해 한 줄로 남겨보세요"
        containerClassName="mt-3"
        className="text-[13px] leading-6 font-medium"
      />
    </li>
  );
}

function TextField({
  label,
  multiline = false,
  required = false,
  value,
  limit,
  onChange,
  disabled,
  placeholder,
  className = '',
  containerClassName = '',
}: {
  label: string;
  multiline?: boolean;
  /** 비어 있으면 저장할 수 없는 칸입니다. 안내 문구에 (필수)를 붙이고, 비면 바로 빨갛게 알려줍니다. */
  required?: boolean;
  value: string;
  limit: number;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  /** 입력칸 글자 모양입니다. */
  className?: string;
  /** 밑줄·안내 문구까지 포함한 칸 바깥 여백입니다. */
  containerClassName?: string;
}) {
  const messageId = useId();
  const count = countStoryText(value.trim());
  const empty = required && count === 0;
  const over = count > limit;
  const error = empty ? '필수 입력값입니다.' : over ? `${limit}자 이내로 입력해주세요.` : null;
  const fieldProps = {
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    disabled,
    placeholder: required ? `${placeholder} (필수)` : `${placeholder} (선택)`,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? messageId : undefined,
  };
  const fieldClassName = `placeholder:text-muted/70 w-full min-w-0 resize-none bg-transparent outline-none disabled:opacity-60 ${className}`;

  return (
    <div className={`min-w-0 flex-1 ${containerClassName}`}>
      <label
        className={`flex min-w-0 items-end gap-2 border-b border-dashed pb-1 ${error ? 'border-danger-strong' : 'border-border-subtle focus-within:border-brand'}`}
      >
        <span className="sr-only">{label}</span>
        {multiline ? (
          <textarea rows={2} {...fieldProps} className={`field-sizing-content ${fieldClassName}`} />
        ) : (
          <input type="text" autoComplete="off" {...fieldProps} className={fieldClassName} />
        )}
        <span
          aria-hidden="true"
          className={`shrink-0 text-[10px] font-semibold tabular-nums ${error ? 'text-danger-strong' : 'text-muted/70'}`}
        >
          {count}/{limit}
        </span>
      </label>
      {error && (
        <p id={messageId} className="text-danger-strong mt-1 text-[11px] font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
