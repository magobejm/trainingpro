import type { LibraryMedia } from './library-media';

export type MobilityExerciseLibraryItem = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
  id: string;
  media: LibraryMedia;
  mobilityType: null | string;
  name: string;
  scope: 'coach' | 'global';
  updatedAt: Date;
  youtubeUrl: null | string;
};
