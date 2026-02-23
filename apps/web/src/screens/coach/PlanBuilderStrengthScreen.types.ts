import type { FieldModeValue, SetRange } from '@trainerpro/ui';

export type BuilderExercise = {
  displayName: string;
  exerciseLibraryId: string;
  globalModes: {
    repsMax: FieldModeValue;
    repsMin: FieldModeValue;
    restSeconds: FieldModeValue;
    setsPlanned: FieldModeValue;
    targetRir: FieldModeValue;
    targetRpe: FieldModeValue;
  };
  globalValues: {
    repsMax: string;
    repsMin: string;
    restSeconds: string;
    setsPlanned: string;
    targetRir: string;
    targetRpe: string;
  };
  id: string;
  perSetRanges: SetRange[];
};
