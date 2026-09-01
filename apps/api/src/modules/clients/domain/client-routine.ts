export type ClientRoutineSet = {
  advancedTechnique: null | string;
  note: null | string;
  setIndex: number;
};

export type ClientRoutineExercise = {
  coachInstructions: null | string;
  displayName: string;
  groupId: null | string;
  groupType: 'CIRCUIT' | 'SUPERSET' | null;
  id: string;
  notes: null | string;
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
  sets: ClientRoutineSet[];
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
