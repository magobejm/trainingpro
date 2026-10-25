export type ActiveRole = 'admin' | 'coach' | 'client';
export * from './first-workout-guide';
export {
  chatMessageListSchema,
  chatMessageSchema,
  clientListResponseSchema,
  clientMeasurementListSchema,
  clientMeasurementSchema,
  clientViewSchema,
  httpErrorSchema,
  sessionViewSchema,
  strengthPlanListItemSchema,
  strengthPlanListResponseSchema,
  type CardioSessionItem,
  type ChatAttachment,
  type ChatCallProposal,
  type ChatMessage,
  type ClientListResponse,
  type ClientMeasurement,
  type ClientMeasurementList,
  type ClientObjective,
  type ClientProgressPhoto,
  type ClientStatus,
  type ClientTimelineItem,
  type ClientTimelineResponse,
  type ClientView,
  type HttpErrorBody,
  type IntervalLog,
  type IsometricSessionItem,
  type IsometricSetLog,
  type MobilitySessionItem,
  type MobilitySetLog,
  type PlannedSet,
  type PlioSessionItem,
  type PlioSetLog,
  type ProgressRecord,
  type ProgressRecordsResponse,
  type SessionItem,
  type SessionView,
  type SetLog,
  type SportLog,
  type SportSessionItem,
  type SportSetLog,
  type StrengthPlanListItem,
  type StrengthPlanListResponse,
  type StrengthPlanSummary,
  type StrengthPlanTemplate,
  type StrengthSessionItem,
} from './http';
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
export {
  MIN_PASSWORD_LENGTH,
  parseRecoveryHash,
  parseRecoveryUrl,
  validateNewPassword,
  type PasswordIssue,
  type RecoveryHash,
} from './password-recovery';
export { physicalTestFields, type PhysicalTestFieldKey } from './physical-test-fields';
export { sessionOutcome, sessionOutcomeSchema, type SessionOutcome } from './session-outcome';
export {
  workoutAdherenceSchema,
  metricCoverageSchema,
  type WorkoutAdherenceSummary,
  type MetricCoverage,
} from './http/progress';
export {
  resolveWorkoutResults,
  sessionDateKey,
  sessionOutcomeRank,
  hasClosedSessionResult,
  type ScheduledWorkout,
  type WorkoutSession,
  type WorkoutResult,
} from './workout-results';
export { weekdayName, workoutShift, type WorkoutShift } from './workout-shift';
export { formatDate } from './format-date';
export type { ExerciseHistoryEntry, ExerciseHistorySet } from './exercise-history';

export * from './client-plan/types';
export * from './client-plan/warmup-schema';
export * from './client-plan/nutrition';
export * from './client-plan/nutrition-day';
export * from './client-plan/nutrition-adherence';
export * from './client-plan/nutrition-shopping';
export * from './client-plan/exercise-groups';
export * from './client-plan/routine-sets';

export {
  CHAT_HISTORY_PAGE_SIZE,
  compareChatMessages,
  emptyChatHistory,
  fetchChatRecent,
  mergeChatHistory,
  mergeChatMessages,
  type ChatHistory,
  type FetchChatPage,
} from './chat-history';

export * from './coach-routine-contract';
export * from './coach-warmup-contract';
export * from './coach-planner';

export type {
  NutritionConsideration as CoachNutritionConsideration,
  MealIngredient as CoachMealIngredient,
  NutritionMeal as CoachNutritionMeal,
  NutritionCheckpoint as CoachNutritionCheckpoint,
  NutritionPlanType as CoachNutritionPlanType,
  NutritionPlan as CoachNutritionPlan,
  MealWriteInput as CoachMealWriteInput,
  PlanWriteInput as CoachPlanWriteInput,
  CheckpointWriteInput as CoachCheckpointWriteInput,
  TdeeFormula as CoachTdeeFormula,
  ActivityLevel as CoachActivityLevel,
  PlanSetupData as CoachPlanSetupData,
  FreePlanItem as CoachFreePlanItem,
  FreePlanContent as CoachFreePlanContent,
  StructuredDayMeal as CoachStructuredDayMeal,
  StructuredDay as CoachStructuredDay,
  StructuredWeek as CoachStructuredWeek,
  StructuredPlanContent as CoachStructuredPlanContent,
} from './nutrition/types';
export { MEAL_CATEGORIES, FREE_PLAN_COLUMNS } from './nutrition/types';
export {
  calculateBmr,
  calculateTdee,
  calculateMacros,
  buildPlanSetupData,
  readSetupData as readCoachNutritionSetupData,
} from './nutrition/calculations';

export * from './routine-handoff';
export * from './http/progress-dashboard';
export * from './routine-comparison';
export * from './routine-day-colors';

export { CARDIO_DEFAULT_LOCKED_VARIABLES } from './exercise-set-variables';
export {
  usesMinuteDuration,
  toSetDisplayValue,
  fromSetDisplayValue,
  normalizeLegacyLockedFields,
  normalizeRoutineSetVariables,
} from './set-variable-units';
export {
  applyProgression,
  linearDeloadPreset,
  progressionRuleSchema,
  progressionWeekIndex,
  suggestNextWeight,
  type AutoLoadRule,
  type ProgressionRule,
  type ProgressionSet,
  type ProgressionWeek,
} from './progression/apply-progression';
export { jacksonPollock3, jacksonPollock7, type SkinfoldSites } from './anthropometry/body-fat';
export {
  fatigueFromSleep,
  HIGH_FATIGUE_AT,
  HIGH_PAIN_AT,
  isHighMorningCheckin,
  isRiskClient,
  MIN_CLIENTS_FOR_COACH_METRICS,
  RISK_ADHERENCE,
  RISK_INACTIVE_DAYS,
} from './triage/thresholds';
export { estimateBilling, type BillingEstimate, type PricingTier } from './billing/pricing-tier';
export {
  heartRateTarget,
  mapCardioToGarminWorkout,
  type GarminCardioBlock,
  type GarminWorkout,
  type GarminWorkoutStep,
} from './integrations/garmin-workout';
export {
  activitiesOverlap,
  assertAiAllowedSource,
  mergeDailyMetrics,
  visibleToCoach,
  type MergedDaily,
  WEARABLE_SOURCES,
  type DailyMetricFields,
  type WearableSource,
} from './integrations/health-sources';
export {
  clientIntakeAnswersSchema,
  PAR_Q_KEYS,
  parqNeedsCoachReview,
  type ClientIntakeAnswers,
} from './intake/client-intake';
