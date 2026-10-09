export type ActiveRole = 'admin' | 'coach' | 'client';
export {
  MAX_ACTIVE_SET_VARIABLES,
  SET_VARIABLE_PRIORITY,
  SPORT_DEFAULT_LOCKED_VARIABLES,
  canUnlockSetVariable,
  resolveLockedFields,
  setVariablesForType,
  type ExerciseBlockType,
  type SetVariableKey,
} from './exercise-set-variables';
export { physicalTestFields, type PhysicalTestFieldKey } from './physical-test-fields';
export { weekdayName, workoutShift, type WorkoutShift } from './workout-shift';
