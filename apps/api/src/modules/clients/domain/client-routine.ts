export type ClientRoutineExercise = {
  displayName: string;
  id: string;
  notes: null | string;
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
  setsPlanned: null | number;
  sortOrder: number;
  targetRir: null | number;
  targetRpe: null | number;
  type: 'strength' | 'cardio' | 'plio' | 'mobility' | 'isometric' | 'sport';
};

export type ClientRoutineDay = {
  dayIndex: number;
  exercises: ClientRoutineExercise[];
  id: string;
  notes: null | string;
  title: string;
};

export type ClientRoutine = {
  expectedCompletionDays: null | number;
  id: string;
  name: string;
  objectives: string[];
  planDays: ClientRoutineDay[];
};
