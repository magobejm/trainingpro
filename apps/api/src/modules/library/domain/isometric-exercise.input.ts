export type IsometricExerciseFilter = {
  isometricType?: string;
  query?: string;
};

export type IsometricExerciseWriteInput = {
  name: string;
  description?: null | string;
  equipment?: null | string;
  isometricType?: null | string;
  notes?: null | string;
  youtubeUrl?: null | string;
  mediaUrl?: null | string;
  mediaType?: null | string;
};
