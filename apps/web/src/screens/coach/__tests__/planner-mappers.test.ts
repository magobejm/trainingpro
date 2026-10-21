import { describe, expect, it } from 'vitest';
import { canUnlockSetVariable, SPORT_DEFAULT_LOCKED_VARIABLES } from '@trainerpro/shared';
import { buildRoutinePayload, createBlock, createEmptyDraft } from '../RoutinePlanner.helpers';
import { mapTemplateBlock } from '../RoutinePlanner.template-mapper';
import { resolveDisplaySets, parseSets } from '../components/RoutinePlanner/warmup-exercise-list.helpers';

describe('createBlock sport locks', () => {
  it('locks the four extra sport variables by default', () => {
    expect(createBlock('sport', 'Fútbol').lockedFields).toEqual(SPORT_DEFAULT_LOCKED_VARIABLES);
  });
});

describe('canUnlockSetVariable lock rule', () => {
  it('blocks a seventh unlocked sport variable', () => {
    expect(canUnlockSetVariable('sport', SPORT_DEFAULT_LOCKED_VARIABLES, 'rir')).toBe(false);
  });
});

describe('mapTemplateBlock sport locks', () => {
  it('applies default sport locks when the template has none', () => {
    const block = mapTemplateBlock('sport', { displayName: 'Fútbol', sortOrder: 0 }, createBlock);
    expect(block.lockedFields).toEqual(SPORT_DEFAULT_LOCKED_VARIABLES);
  });
});

describe('buildRoutinePayload exercise rest', () => {
  it('fills the exercise rest from the first series', () => {
    const draft = createEmptyDraft((key) => key);
    draft.days[0]?.blocks.push({
      displayName: 'Remo',
      id: 'b1',
      restSeconds: 60,
      sets: [{ restSeconds: 120, setIndex: 0 }],
      type: 'strength',
    });
    const day = buildRoutinePayload(draft).days[0];
    expect(day?.exercises[0]?.restSeconds).toBe(120);
    expect(day?.exercises[0]?.sets[0]?.restSeconds).toBe(120);
  });
});

describe('parseSets', () => {
  it('reads duration, rom and heart-rate fields from metadata', () => {
    expect(
      parseSets({
        metadataJson: {
          sets: [{ setIndex: 0, durationSeconds: 90, rom: 'completo', weightKg: 5, fcMaxPct: 80 }],
        },
      } as never),
    ).toEqual([
      {
        setIndex: 0,
        distanceMeters: undefined,
        durationSeconds: 90,
        fcMaxPct: 80,
        fcReservePct: undefined,
        heartRate: undefined,
        reps: undefined,
        rpe: undefined,
        weightKg: 5,
        rir: undefined,
        restSeconds: undefined,
        rom: 'completo',
        note: undefined,
      },
    ]);
  });
});

it('round trips distance prescriptions for cardio and sport', () => {
  const draft = createEmptyDraft((key) => key);
  for (const type of ['cardio', 'sport'] as const)
    draft.days[0]!.blocks.push({
      ...createBlock(type, type),
      sets: [{ setIndex: 0, distanceMeters: 1250, durationSeconds: 150 }],
    });
  const payload = buildRoutinePayload(draft);
  for (const key of ['cardioBlocks', 'sportBlocks'] as const) {
    const block = payload.days[0]![key][0]!;
    expect(block.sets[0]).toMatchObject({ distanceMeters: 1250, durationSeconds: 150 });
    expect(mapTemplateBlock(key === 'cardioBlocks' ? 'cardio' : 'sport', block, createBlock).sets?.[0]).toMatchObject({
      distanceMeters: 1250,
      durationSeconds: 150,
    });
  }
});

it('shows legacy warmup durations inside the sets', () => {
  expect(resolveDisplaySets({ blockType: 'cardio', roundsPlanned: 2, workSeconds: 120 } as never)).toEqual([
    { setIndex: 0, durationSeconds: 120 },
    { setIndex: 1, durationSeconds: 120 },
  ]);
  expect(resolveDisplaySets({ blockType: 'sport', durationMinutes: 30 } as never)).toEqual([
    { setIndex: 0, durationSeconds: 1800 },
  ]);
});

it('round trips the cardio header distance independently of interval distance', () => {
  const draft = createEmptyDraft((key) => key);
  const block = { ...createBlock('cardio', 'Bici'), targetDistanceMeters: 1250 };
  draft.days[0]!.blocks.push(block);
  const saved = buildRoutinePayload(draft).days[0]!.cardioBlocks[0]!;
  expect(saved.targetDistanceMeters).toBe(1250);
  expect(mapTemplateBlock('cardio', saved, createBlock)).toMatchObject({ targetDistanceMeters: 1250 });
});
