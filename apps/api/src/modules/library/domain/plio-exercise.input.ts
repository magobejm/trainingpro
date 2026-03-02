export type PlioExerciseFilter = {
  plioType?: string;
  query?: string;
};

export type PlioExerciseWriteInput = {
  name: string;
  description?: null | string;
  equipment?: null | string;
  plioType?: null | string;
  notes?: null | string;
  youtubeUrl?: null | string;
  mediaUrl?: null | string;
  mediaType?: null | string;
};
