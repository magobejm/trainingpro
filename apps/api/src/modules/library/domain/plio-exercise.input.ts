export type PlioExerciseFilter = {
  query?: string;
};

export type PlioExerciseWriteInput = {
  name: string;
  description?: null | string;
  notes?: null | string;
  youtubeUrl?: null | string;
  mediaUrl?: null | string;
  mediaType?: null | string;
};
