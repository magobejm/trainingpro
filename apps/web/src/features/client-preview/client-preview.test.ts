import { describe, expect, it } from 'vitest';
import { buildRoutinePreview } from './routine-preview';
import { buildMealGroups } from '../../../../../packages/shared/src/client-plan/nutrition';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClientExerciseCard } from '../../../../../packages/ui/src/client-plan/ClientExerciseCard';
import { ClientNutritionMealGroups } from '../../../../../packages/ui/src/client-plan/ClientNutritionContent';
import { resolvePreviewWarmups } from './routine-preview-warmups';

describe('client preview draft adapters', () => {
  it('keeps all day types, prescribed sets and groups without mutating the draft', () => {
    const draft = {
      name: 'Draft',
      days: [
        {
          id: 'day',
          title: 'A',
          groups: [{ id: 'g', groupType: 'SUPERSET' as const, sortOrder: 0 }],
          blocks: [
            {
              id: 'a',
              displayName: 'Squat',
              type: 'strength' as const,
              groupId: 'g',
              sets: [
                { setIndex: 0, reps: 6, weightKg: 40, note: 'Slow' },
                { setIndex: 1, reps: 8, weightKg: 30 },
              ],
            },
            ...(['cardio', 'plio', 'mobility', 'sport', 'isometric'] as const).map((type) => ({
              id: type,
              displayName: type,
              type,
              sets: [{ setIndex: 0, durationSeconds: 25 }],
            })),
          ],
        },
      ],
      neats: [{ id: 'n', title: 'Walk', description: '20 min' }],
    };
    const before = JSON.stringify(draft);
    const result = buildRoutinePreview(draft);
    expect(result.planDays[0]?.exercises).toHaveLength(6);
    expect(result.planDays[0]?.exercises[0]?.sets[1]?.weightKg).toBe(30);
    expect(result.planDays[0]?.exercises[0]?.groupType).toBe('SUPERSET');
    expect(result.neats?.[0]?.description).toBe('20 min');
    expect(JSON.stringify(draft)).toBe(before);
  });

  it('does not invent set values or missing library references', () => {
    const result = buildRoutinePreview({
      name: '',
      days: [{ id: 'd', title: '', blocks: [{ id: 'x', displayName: '', type: 'strength', setsPlanned: 2 }] }],
    });
    expect(result.planDays[0]?.exercises[0]?.sets).toHaveLength(2);
    expect(result.planDays[0]?.exercises[0]?.sets[0]?.reps).toBeNull();
    expect(result.planDays[0]?.exercises[0]?.coachInstructions).toBeNull();
  });

  it('uses prescribed rep range fallback and stable set ordering like the client API', () => {
    const routine = buildRoutinePreview({
      name: 'A',
      days: [
        {
          id: 'd',
          title: 'Day',
          blocks: [
            {
              id: 'b',
              type: 'strength',
              displayName: 'A',
              repsRange: '6-10',
              sets: [
                { setIndex: 1, weightKg: 30 },
                { setIndex: 0, weightKg: 40 },
              ],
            },
          ],
        },
      ],
    });
    expect(routine.planDays[0]?.exercises[0]?.sets.map((set) => [set.setIndex, set.reps, set.weightKg])).toEqual([
      [0, 10, 40],
      [1, 10, 30],
    ]);
  });
  it('uses client-facing coach instructions instead of coach-only library notes', () => {
    const routine = buildRoutinePreview(
      {
        name: 'A',
        days: [{ id: 'd', title: 'Day', blocks: [{ id: 'b', libraryId: 'lib', type: 'strength', displayName: 'A' }] }],
      },
      { strength: [{ id: 'lib', instructions: 'Private library notes', coachInstructions: 'Client instructions' }] },
    );
    expect(routine.planDays[0]?.exercises[0]?.coachInstructions).toBe('Client instructions');
  });
});

describe('shared client presentation', () => {
  it('resolves referenced warmups before normal exercises and preserves circuit grouping without changing the draft', () => {
    const draft = {
      name: 'A',
      days: [
        {
          id: 'd',
          title: 'A',
          warmupTemplates: [{ id: 'w', name: 'Warmup' }],
          blocks: [{ id: 'main', type: 'strength' as const, displayName: 'Main' }],
        },
      ],
    };
    const before = JSON.stringify(draft);
    const resolved = resolvePreviewWarmups(draft, [
      {
        id: 'w',
        name: 'Warmup',
        groups: [{ id: 'g', groupType: 'CIRCUIT', sortOrder: 0 }],
        items: [{ blockType: 'mobility', displayName: 'Warmup movement', groupId: 'g', sortOrder: 0, roundsPlanned: 2 }],
      },
    ]);
    const clientDay = buildRoutinePreview(resolved).planDays[0]!;
    expect(clientDay.exercises[0]?.displayName).toBe('Warmup movement');
    expect(clientDay.exercises[0]?.groupType).toBe('CIRCUIT');
    expect(clientDay.exercises[0]?.sets).toHaveLength(2);
    expect(clientDay.exercises[1]?.displayName).toBe('Main');
    expect(JSON.stringify(draft)).toBe(before);
  });

  it.each(['strength', 'cardio', 'mobility', 'plio', 'isometric', 'sport'] as const)(
    'renders both prescribed sets for %s with no editable fields',
    (type) => {
      const exercise = buildRoutinePreview({
        name: 'A',
        days: [
          {
            id: 'd',
            title: 'A',
            blocks: [
              {
                id: 'b',
                type,
                displayName: type,
                lockedFields: type === 'sport' ? ['weightKg', 'rpe', 'fcMaxPct', 'rir'] : [],
                sets: [
                  {
                    setIndex: 0,
                    reps: 6,
                    durationSeconds: 30,
                    rom: 'full',
                    weightKg: 10,
                    fcMaxPct: 80,
                    fcReservePct: 70,
                    heartRate: 140,
                    rpe: 8,
                    rir: 2,
                    restSeconds: 60,
                  },
                  {
                    setIndex: 1,
                    reps: 8,
                    durationSeconds: 40,
                    rom: 'partial',
                    weightKg: 12,
                    fcMaxPct: 85,
                    fcReservePct: 75,
                    heartRate: 150,
                    rpe: 9,
                    rir: 1,
                    restSeconds: 90,
                  },
                ],
              },
            ],
          },
        ],
      }).planDays[0]!.exercises[0]!;
      const html = renderToStaticMarkup(
        React.createElement(ClientExerciseCard, { exercise, expanded: true, onToggle: () => undefined, t: (key) => key }),
      );
      expect(html).toContain('client.today.set 1');
      expect(html).toContain('client.today.set 2');
      expect(html).not.toMatch(/<(input|textarea|select)/);
      expect(html).toContain('1 min 0 s');
      expect(html).toContain('1 min 30 s');
      if (type === 'cardio' || type === 'sport') {
        expect(html).toContain('140');
        expect(html).toContain('150');
      }
      if (type === 'mobility' || type === 'sport') {
        expect(html).toContain('full');
        expect(html).toContain('partial');
      }
    },
  );
});

describe('readonly client details', () => {
  it('renders every prescribed row, advanced technique and set note without inputs', () => {
    const routine = buildRoutinePreview({
      name: 'Plan',
      days: [
        {
          id: 'd',
          title: 'Day',
          blocks: [
            {
              id: 'x',
              type: 'strength',
              displayName: 'Squat',
              lockedFields: [],
              sets: [
                { setIndex: 0, reps: 6, note: 'Slow descent' },
                { setIndex: 1, reps: 9, advancedTechnique: 'dropSet' },
              ],
            },
          ],
        },
      ],
    });
    const markup = renderToStaticMarkup(
      React.createElement(ClientExerciseCard, {
        exercise: routine.planDays[0]!.exercises[0]!,
        expanded: true,
        onToggle: () => undefined,
        t: (key) => key,
      }),
    );
    expect(markup).toContain('Slow descent');
    expect(markup).toContain('dropSet');
    expect(markup).toContain('Squat');
    expect(markup).not.toContain('<input');
    expect(markup).toContain('client.today.set 2');
  });
  it('renders shared nutrition groups and quantities', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ClientNutritionMealGroups, {
        groups: [{ category: 'breakfast', items: [{ label: 'Oats', sublabel: '35 g' }] }],
        t: (key) => key,
      }),
    );
    expect(markup).toContain('Oats');
    expect(markup).toContain('35 g');
    expect(markup).not.toContain('<input');
  });
});

describe('shared mobile nutrition presentation', () => {
  it('preserves free-plan quantities including zero', () => {
    expect(
      buildMealGroups({
        type: 'LIBRE',
        content: { columns: { breakfast: [{ type: 'food', id: 'f', foodName: 'Oats', amountGrams: 0 }] } },
      })[0]?.items[0]?.sublabel,
    ).toBe('0 g');
  });
  it('matches mobile structured first-week presentation including meal times', () => {
    const plan = {
      type: 'ESTRUCTURADO' as const,
      content: {
        weeks: [
          { days: [{ label: 'Monday', meals: [{ name: 'Lunch', time: '13:00' }] }] },
          { days: [{ label: 'Later', meals: [] }] },
        ],
      },
    };
    expect(buildMealGroups(plan)).toEqual([
      { category: 'Monday', items: [{ label: 'Lunch', mealId: undefined, sublabel: '13:00' }] },
    ]);
  });
});
