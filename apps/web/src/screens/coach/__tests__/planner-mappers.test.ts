import { describe, expect, it } from 'vitest';
import { canUnlockSetVariable, SPORT_DEFAULT_LOCKED_VARIABLES } from '@trainerpro/shared';
import { buildRoutinePayload, createBlock, createEmptyDraft } from '../RoutinePlanner.helpers';
import { mapTemplateBlock } from '../RoutinePlanner.template-mapper';
import { parseSets } from '../components/RoutinePlanner/warmup-exercise-list.helpers';

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
