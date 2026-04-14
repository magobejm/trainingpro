export type AnalysisMode = 'exercise' | 'session' | 'microcycle';

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
