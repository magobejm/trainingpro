export type ExerciseMuscleGroupSeed = {
  code: string;
  isDefault: boolean;
  label: string;
  sortOrder: number;
};

export const EXERCISE_MUSCLE_GROUPS_V1: ExerciseMuscleGroupSeed[] = [
  { code: 'sin_definir', isDefault: true, label: 'Sin definir', sortOrder: 0 },
  { code: 'pecho', isDefault: false, label: 'Pecho', sortOrder: 10 },
  { code: 'espalda', isDefault: false, label: 'Espalda', sortOrder: 20 },
  { code: 'pierna', isDefault: false, label: 'Pierna', sortOrder: 30 },
  { code: 'hombro', isDefault: false, label: 'Hombro', sortOrder: 40 },
  { code: 'core', isDefault: false, label: 'Core', sortOrder: 50 },
  { code: 'brazo', isDefault: false, label: 'Brazo', sortOrder: 60 },
];
