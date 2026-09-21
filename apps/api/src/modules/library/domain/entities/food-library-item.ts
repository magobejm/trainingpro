import type { LibraryMedia } from './library-media';

export type FoodLibraryItem = {
  caloriesKcal: null | number;
  carbsG: null | number;
  coachMembershipId: null | string;
  createdAt: Date;
  fatG: null | number;
  fiberG: null | number;
  foodCategory: null | string;
  foodType: null | string;
  id: string;
  media: LibraryMedia;
  micronutrients: string[];
  name: string;
  notes: null | string;
  proteinG: null | number;
  saltG: null | number;
  saturatedFatG: null | number;
  scope: 'coach' | 'global';
  servingUnit: null | string;
  sugarG: null | number;
  unsaturatedFatG: null | number;
  updatedAt: Date;
};
