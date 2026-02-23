import type { FieldModeValue, SetRange } from '@trainerpro/ui';
import type { BuilderExercise } from './PlanBuilderStrengthScreen.types';

export function appendRange(item: BuilderExercise, id: string): BuilderExercise {
  if (item.id !== id) {
    return item;
  }
  return { ...item, perSetRanges: [...item.perSetRanges, { maxKg: '', minKg: '' }] };
}

export function replaceRange(
  item: BuilderExercise,
  id: string,
  index: number,
  range: SetRange,
): BuilderExercise {
  if (item.id !== id) {
    return item;
  }
  const next = item.perSetRanges.map((entry, idx) => (idx === index ? range : entry));
  return { ...item, perSetRanges: next };
}

export function addExercise(
  state: BuilderExercise[],
  id: string,
  pickerItems: { id: string; title: string }[],
): BuilderExercise[] {
  if (state.some((item) => item.id === id)) {
    return state;
  }
  const source = pickerItems.find((item) => item.id === id);
  if (!source) {
    return state;
  }
  return [...state, buildBuilderExercise(source, id)];
}

function buildBuilderExercise(source: { title: string }, id: string): BuilderExercise {
  return {
    displayName: source.title,
    exerciseLibraryId: id,
    globalModes: {
      repsMax: 'COACH_INPUT',
      repsMin: 'COACH_INPUT',
      restSeconds: 'COACH_INPUT',
      setsPlanned: 'COACH_INPUT',
      targetRir: 'COACH_INPUT',
      targetRpe: 'COACH_INPUT',
    },
    globalValues: {
      repsMax: '',
      repsMin: '',
      restSeconds: '',
      setsPlanned: '',
      targetRir: '',
      targetRpe: '',
    },
    id,
    perSetRanges: [],
  };
}

export function mapPickerItems(items: { id: string; muscleGroup: string; name: string }[]) {
  return items.map((item) => ({ id: item.id, subtitle: item.muscleGroup, title: item.name }));
}

export function buildTemplatePayload(name: string, selected: BuilderExercise[], dayTitle: string) {
  return {
    days: [{ dayIndex: 1, exercises: selected.map(buildExercisePayload), title: dayTitle }],
    name,
  };
}

function buildExercisePayload(item: BuilderExercise, index: number) {
  return {
    displayName: item.displayName,
    exerciseLibraryId: item.exerciseLibraryId,
    fieldModes: [
      { fieldKey: 'repsMax', mode: item.globalModes.repsMax },
      { fieldKey: 'repsMin', mode: item.globalModes.repsMin },
      { fieldKey: 'restSeconds', mode: item.globalModes.restSeconds },
      { fieldKey: 'setsPlanned', mode: item.globalModes.setsPlanned },
      { fieldKey: 'targetRir', mode: item.globalModes.targetRir },
      { fieldKey: 'targetRpe', mode: item.globalModes.targetRpe },
    ],
    perSetWeightRanges: item.perSetRanges.map((range) => ({
      maxKg: toNumber(range.maxKg),
      minKg: toNumber(range.minKg),
    })),
    repsMax: toNumber(item.globalValues.repsMax),
    repsMin: toNumber(item.globalValues.repsMin),
    restSeconds: toNumber(item.globalValues.restSeconds),
    setsPlanned: toNumber(item.globalValues.setsPlanned),
    sortOrder: index,
    targetRir: toNumber(item.globalValues.targetRir),
    targetRpe: toNumber(item.globalValues.targetRpe),
    weightRangeMaxKg: null,
    weightRangeMinKg: null,
  };
}

function toNumber(value: string | null | undefined): null | number {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export type TemplateInputDto = {
  days?: Array<{
    exercises: Array<{
      displayName: string;
      exerciseLibraryId?: string;
      id: string;
      fieldModes?: Array<{ fieldKey: string; mode: FieldModeValue }>;
      prescription?: {
        repsMax?: number;
        repsMin?: number;
        restSeconds?: number;
        setsPlanned?: number;
        targetRir?: number;
        targetRpe?: number;
        perSetWeightRanges?: Array<{ maxKg?: number; minKg?: number }>;
      };
      perSetWeightRanges?: Array<{ maxKg?: number; minKg?: number }>;
    }>;
  }>;
};

export function mapTemplateToBuilder(template: unknown): BuilderExercise[] {
  const safeTemplate = template as TemplateInputDto;
  const day = safeTemplate.days?.[0];
  if (!day) return [];
  return day.exercises.map(mapExerciseToBuilder);
}

type InputExercise = NonNullable<
  NonNullable<TemplateInputDto['days']>[number]['exercises']
>[number];

function parseGlobalModes(ex: InputExercise): BuilderExercise['globalModes'] {
  const getMode = (key: string): FieldModeValue => {
    const field = ex.fieldModes?.find((fm) => fm.fieldKey === key);
    return field ? field.mode : 'COACH_INPUT'; // Default
  };
  return {
    repsMax: getMode('repsMax'),
    repsMin: getMode('repsMin'),
    restSeconds: getMode('restSeconds'),
    setsPlanned: getMode('setsPlanned'),
    targetRir: getMode('targetRir'),
    targetRpe: getMode('targetRpe'),
  };
}

function parseGlobalValues(ex: InputExercise): BuilderExercise['globalValues'] {
  return {
    repsMax: String(ex.prescription?.repsMax ?? ''),
    repsMin: String(ex.prescription?.repsMin ?? ''),
    restSeconds: String(ex.prescription?.restSeconds ?? ''),
    setsPlanned: String(ex.prescription?.setsPlanned ?? ''),
    targetRir: String(ex.prescription?.targetRir ?? ''),
    targetRpe: String(ex.prescription?.targetRpe ?? ''),
  };
}

function mapExerciseToBuilder(ex: InputExercise): BuilderExercise {
  const ranges = ex.prescription?.perSetWeightRanges || ex.perSetWeightRanges || [];
  return {
    displayName: ex.displayName,
    exerciseLibraryId: ex.exerciseLibraryId || ex.id,
    globalModes: parseGlobalModes(ex),
    globalValues: parseGlobalValues(ex),
    id: ex.exerciseLibraryId || ex.id,
    perSetRanges: ranges.map((r) => ({
      maxKg: String(r.maxKg ?? ''),
      minKg: String(r.minKg ?? ''),
    })),
  };
}
