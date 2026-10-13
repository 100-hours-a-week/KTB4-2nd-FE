import { STORY_MOODS, type StoryMood } from '@/features/createStory';

export function StoryMoodSelector({
  mood,
  onChange,
}: {
  mood: StoryMood | null;
  onChange: (mood: StoryMood) => void;
}) {
  return (
    <fieldset className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pb-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
      <legend className="sr-only">스토리 분위기 선택</legend>
      {STORY_MOODS.map((option) => (
        <label
          key={option.value}
          className={`relative flex min-h-18 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ${mood === option.value ? 'border-brand bg-surface-subtle ring-brand ring-1 ring-inset' : 'border-border-subtle'}`}
        >
          <span>
            <strong className="block text-sm font-extrabold">{option.label}</strong>
            <span className="text-muted mt-1 block text-[11px]">{option.description}</span>
          </span>
          <input
            type="radio"
            name="story-mood"
            value={option.value}
            checked={mood === option.value}
            onChange={() => onChange(option.value)}
            className="focus-visible:outline-brand size-5 shrink-0 appearance-none rounded-full border-2 border-slate-300 bg-white checked:border-[6px] checked:border-brand focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </label>
      ))}
    </fieldset>
  );
}
