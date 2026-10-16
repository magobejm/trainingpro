export type CoachLibraryItem = {
  id: string;
  kind?: string;
  name: string;
  scope?: string;
  mediaUrl?: string;
  media?: { url?: string };
  youtubeUrl?: string;
  instructions?: string;
  coachInstructions?: string;
  equipmentId?: string;
  movementPatternId?: string;
  anatomicalPlaneId?: string;
  muscleGroups?: { muscleGroupId?: string; id?: string }[];
  [field: string]: unknown;
};
export type Catalog = { id: string; label: string };
export const categories = ['strength', 'cardio', 'isometric', 'plio', 'mobility', 'sport', 'foods'];
export const catalogFields: Record<string, string> = {
  equipmentId: 'equipmentTypes',
  movementPatternId: 'movementPatterns',
  anatomicalPlaneId: 'anatomicalPlanes',
  cardioTypeId: 'cardioMethodTypes',
  plioTypeId: 'plioTypes',
  mobilityTypeId: 'mobilityTypes',
  isometricTypeId: 'isometricTypes',
  sportTypeId: 'sportTypes',
};
export const foodNumbers = [
  'caloriesKcal',
  'proteinG',
  'carbsG',
  'fatG',
  'fiberG',
  'sugarG',
  'saturatedFatG',
  'unsaturatedFatG',
  'saltG',
];
