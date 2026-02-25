export type WarmupExerciseFilter = {
  query?: string;
};

export type WarmupExerciseWriteInput = {
  name: string;
  description?: null | string;
  notes?: null | string;
  youtubeUrl?: null | string;
  mediaUrl?: null | string;
  mediaType?: null | string;
};
