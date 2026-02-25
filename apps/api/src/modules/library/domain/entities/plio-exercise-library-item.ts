import type { LibraryMedia } from './library-media';

export type PlioExerciseLibraryItem = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
  id: string;
  media: LibraryMedia;
  name: string;
  notes: null | string;
  scope: 'coach' | 'global';
  updatedAt: Date;
  youtubeUrl: null | string;
};
