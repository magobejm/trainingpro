export type ExerciseMuscleGroupSeed = {
  code: string;
  isDefault: boolean;
  label: string;
  sortOrder: number;
};

export const EXERCISE_MUSCLE_GROUPS_V1: ExerciseMuscleGroupSeed[] = [
  { code: 'undefined', isDefault: true, label: 'Sin definir', sortOrder: 0 },
  { code: 'pectoral', isDefault: false, label: 'Pectoral', sortOrder: 10 },
  { code: 'espalda', isDefault: false, label: 'Espalda', sortOrder: 20 },
  { code: 'deltoides', isDefault: false, label: 'Deltoides', sortOrder: 30 },
  { code: 'biceps', isDefault: false, label: 'Biceps', sortOrder: 40 },
  { code: 'triceps', isDefault: false, label: 'Triceps', sortOrder: 50 },
  { code: 'cuadriceps', isDefault: false, label: 'Cuadriceps', sortOrder: 60 },
  { code: 'femoral', isDefault: false, label: 'Femoral', sortOrder: 70 },
  { code: 'gluteo', isDefault: false, label: 'Gluteo', sortOrder: 80 },
  { code: 'core', isDefault: false, label: 'Core', sortOrder: 90 },
  { code: 'aductor', isDefault: false, label: 'Aductor', sortOrder: 100 },
  { code: 'antebrazo', isDefault: false, label: 'Antebrazo', sortOrder: 110 },
  { code: 'gemelo', isDefault: false, label: 'Gemelo', sortOrder: 120 },
  { code: 'espalda_baja', isDefault: false, label: 'Espalda baja', sortOrder: 130 },
  { code: 'abdomen', isDefault: false, label: 'Abdomen', sortOrder: 140 },
  { code: 'flexores_cadera', isDefault: false, label: 'Flexores de cadera', sortOrder: 150 },
  { code: 'gemelo_gastrocnemio', isDefault: false, label: 'Gemelo (Gastrocnemio)', sortOrder: 160 },
  { code: 'gemelo_soleo', isDefault: false, label: 'Gemelo (Soleo)', sortOrder: 170 },
];
