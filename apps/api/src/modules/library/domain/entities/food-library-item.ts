import type { LibraryMedia } from './library-media';

export type FoodLibraryItem = {
  caloriesKcal: null | number;
  carbsG: null | number;
  coachMembershipId: null | string;
  createdAt: Date;
  fatG: null | number;
  foodCategory: null | string;
  foodType: null | string;
  id: string;
  media: LibraryMedia;
  name: string;
  notes: null | string;
  proteinG: null | number;
  scope: 'coach' | 'global';
  servingUnit: null | string;
  updatedAt: Date;
};
