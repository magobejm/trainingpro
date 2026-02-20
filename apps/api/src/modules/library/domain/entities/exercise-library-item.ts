import type { LibraryMedia } from './library-media';

export type ExerciseLibraryItem = {
  coachMembershipId: null | string;
  createdAt: Date;
  equipment: null | string;
  id: string;
  instructions: null | string;
  media: LibraryMedia;
  youtubeUrl: null | string;
  muscleGroupId: string;
  muscleGroup: string;
  name: string;
  scope: 'coach' | 'global';
  updatedAt: Date;
};
