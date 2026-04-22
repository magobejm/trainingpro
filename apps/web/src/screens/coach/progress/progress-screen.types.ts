export type AnalysisMode = 'exercise' | 'session' | 'microcycle';

export type ExerciseType = 'strength' | 'cardio' | 'plio' | 'mobility' | 'isometric' | 'sport';

export type SelectedExercise = {
  id: string;
  type: ExerciseType;
  name: string;
};

export type VariableDef = {
  id: string;
  labelKey: string;
  unit: string;
  color: string;
  dataKey: string;
};

export type DateRange = {
  from: string;
  to: string;
};
