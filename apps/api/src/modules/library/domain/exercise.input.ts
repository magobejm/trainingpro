export type ExerciseFilter = {
  muscleGroupId?: string;
  query?: string;
};

export type ExerciseWriteInput = {
  equipment?: null | string;
  instructions?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  youtubeUrl?: null | string;
  muscleGroupId: string;
  name: string;
};
