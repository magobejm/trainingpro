export type WeightRange = {
  maxKg: null | number;
  minKg: null | number;
};

export type StrengthPrescription = {
  defaultWeightRange: WeightRange;
  perSetWeightRanges: WeightRange[];
  repsMax: null | number;
  repsMin: null | number;
  setsPlanned: null | number;
};
