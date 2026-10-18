export type ClientRoutineSet = {
  advancedTechnique: null | string;
  durationSeconds?: null | number;
  fcMaxPct?: null | number;
  fcReservePct?: null | number;
  heartRate?: null | number;
  note: null | string;
  reps?: null | number;
  restSeconds?: null | number;
  rir?: null | number;
  rom?: null | string;
  rpe?: null | number;
  setIndex: number;
  weightKg?: null | number;
};

export type ClientRoutineExercise = {
  coachInstructions: null | string;
  displayName: string;
  lockedFields?: string[];
  mediaUrl: null | string;
  youtubeUrl: null | string;
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
  type: 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';
};

export type ClientRoutineDay = {
  warmups?: ClientRoutineWarmup[];
  dayIndex: number;
  exercises: ClientRoutineExercise[];
  id: string;
  notes: null | string;
  title: string;
};

export type ClientRoutineWarmup = {
  id: string;
  name: string;
  description: string | null;
  exercises: ClientRoutineExercise[];
};

export type ClientRoutineNeat = {
  description: null | string;
  id: string;
  title: string;
};

export type ClientRoutine = {
  expectedCompletionDays: null | number;
  id: string;
  name: string;
  neats?: ClientRoutineNeat[];
  objectives: string[];
  planDays: ClientRoutineDay[];
};

export type NutritionConsideration = {
  code: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  tone: 'bad' | 'good' | 'neutral';
  values?: { x?: number };
  variant: number;
};

export type NutritionPlanType = 'ESTRUCTURADO' | 'LIBRE';

export type NutritionCheckpoint = {
  content: unknown;
  createdAt: string;
  endDate: null | string;
  id: string;
  note: null | string;
  planId: string;
  planName: null | string;
  setupData: unknown;
  startDate: null | string;
};

export type NutritionPlan = {
  checkpoints: NutritionCheckpoint[];
  clientId: null | string;
  content: unknown;
  description: null | string;
  id: string;
  name: string;
  setupData: unknown;
  sourcePlanId: null | string;
  strategy: null | string;
  type: NutritionPlanType;
};

export type ClientNutrition = {
  estructuradoPlan?: NutritionPlan;
  foods?: Array<{
    considerations?: NutritionConsideration[];
    id: string;
    name: string;
  }>;
  librePlan?: NutritionPlan;
  meals?: Array<{
    considerations?: NutritionConsideration[];
    id: string;
    name: string;
  }>;
};
