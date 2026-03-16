export type MobilityExerciseFilter = {
  mobilityType?: string;
  query?: string;
};

export type MobilityExerciseWriteInput = {
  name: string;
  description?: null | string;
  mobilityType?: null | string;
  youtubeUrl?: null | string;
  mediaUrl?: null | string;
  mediaType?: null | string;
};
