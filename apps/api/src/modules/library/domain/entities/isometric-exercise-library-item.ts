import type { LibraryMedia } from './library-media';

export type IsometricExerciseLibraryItem = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
  equipment: null | string;
  id: string;
  isometricType: null | string;
  media: LibraryMedia;
  name: string;
  notes: null | string;
  scope: 'coach' | 'global';
  updatedAt: Date;
  youtubeUrl: null | string;
};
