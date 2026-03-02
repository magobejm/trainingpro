export type WarmupExerciseFilter = {
  mobilityType?: string;
  query?: string;
};

export type WarmupExerciseWriteInput = {
  name: string;
  description?: null | string;
  mobilityType?: null | string;
  youtubeUrl?: null | string;
  mediaUrl?: null | string;
  mediaType?: null | string;
};
