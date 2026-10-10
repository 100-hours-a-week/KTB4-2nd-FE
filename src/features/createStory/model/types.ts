export const STORY_FOLDER_LIMIT = 10;
export const STORY_MOODS = [
  { value: 'PLAIN', label: '담백하게', description: '군더더기 없이 사실 위주로' },
  { value: 'EMOTIONAL', label: '감성적으로', description: '그날의 감정과 분위기를 담아' },
  { value: 'HUMOROUS', label: '유쾌하게', description: '가볍고 위트 있게' },
  { value: 'CALM', label: '차분하게', description: '잔잔하고 담담한 어투로' },
  { value: 'LITERARY', label: '문학적으로', description: '비유와 묘사를 살려 풍성하게' },
] as const;
export type StoryMood = (typeof STORY_MOODS)[number]['value'];
export type StoryGenerationInput = { tripId: number; mood: StoryMood; folderIds: number[] };

export type StoryProgressEvent = { progressPercent: number; message: string };

export type StoryGenerationRequest = (
  input: StoryGenerationInput,
  signal: AbortSignal,
  onProgress: (event: StoryProgressEvent) => void,
) => Promise<void>;
