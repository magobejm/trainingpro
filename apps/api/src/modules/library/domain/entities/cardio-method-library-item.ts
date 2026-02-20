import type { LibraryMedia } from './library-media';

export type CardioMethodLibraryItem = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
  id: string;
  media: LibraryMedia;
  youtubeUrl: null | string;
  methodTypeId: string;
  methodType: string;
  name: string;
  scope: 'coach' | 'global';
  updatedAt: Date;
};
