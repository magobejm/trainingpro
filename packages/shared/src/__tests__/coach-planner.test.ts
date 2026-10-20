import { coachRoutineSchema, moveCoachItem, nutritionAmountTotals, normalizeCoachRoutine } from '../coach-planner';

it('saves API cardio blocks without a method while preserving explicit methods and canonical series', () => {
  const block = {
    displayName: 'Carrera',
    sortOrder: 0,
    roundsPlanned: 1,
    restSeconds: 30,
    workSeconds: 150,
    fieldModes: [{ fieldKey: 'durationSeconds', mode: 'COACH_INPUT' }],
    sets: [{ setIndex: 0, distanceMeters: 1250, durationSeconds: 150 }],
  };
  const input = {
    name: 'API routine',
    days: [{ title: 'Día', cardioBlocks: [block, { ...block, sortOrder: 1, methodType: 'intervalos' }] }],
  };
  const result = coachRoutineSchema.parse(normalizeCoachRoutine(input));
  expect(result.days[0]?.cardioBlocks.map((row) => row.methodType)).toEqual(['continuo', 'intervalos']);
  expect(result.days[0]?.cardioBlocks[0]?.sets[0]).toMatchObject({ distanceMeters: 1250, durationSeconds: 150 });
  expect(block).not.toHaveProperty('methodType');
});

describe('coach planner interoperability', () => {
  it('round trips every block category and advanced prescription', () => {
    const value = {
      name: 'Mixta',
      days: [
        {
          dayIndex: 1,
          title: 'Día 1',
          groups: [{ clientId: 'g1', groupType: 'SUPERSET', sortOrder: 0 }],
          exercises: [
            {
              displayName: 'Sentadilla',
              fieldModes: [{ fieldKey: 'weightKg', mode: 'CLIENT_INPUT' }],
              sortOrder: 0,
              groupId: 'g1',
              sets: [{ setIndex: 0, reps: 8, advancedTechnique: 'drop_set', rpe: 7.5, note: 'Pausa' }],
            },
          ],
          cardioBlocks: [
            {
              displayName: 'Carrera',
              methodType: 'continuo',
              fieldModes: [{ fieldKey: 'durationSeconds', mode: 'CLIENT_INPUT' }],
              roundsPlanned: 1,
              restSeconds: 0,
              workSeconds: 60,
              sortOrder: 1,
            },
          ],
          isometricBlocks: [{ displayName: 'Plancha', sortOrder: 2 }],
          plioBlocks: [{ displayName: 'Salto', roundsPlanned: 1, restSeconds: 30, workSeconds: 10, sortOrder: 3 }],
          mobilityBlocks: [{ displayName: 'Cadera', roundsPlanned: 1, restSeconds: 0, workSeconds: 20, sortOrder: 4 }],
          sportBlocks: [{ displayName: 'Tenis', durationMinutes: 30, sortOrder: 5 }],
        },
      ],
      neats: [{ title: 'Pasear', description: '30 minutos' }],
    };
    const result = coachRoutineSchema.parse(normalizeCoachRoutine(value));
    expect(result.days[0]?.exercises[0]?.sets[0]?.advancedTechnique).toBe('drop_set');
    expect(result.days[0]?.groups[0]?.clientId).toBe('g1');
    expect(result.days[0]?.sportBlocks[0]?.durationMinutes).toBe(30);
    expect(coachRoutineSchema.safeParse({ ...value, name: '' }).success).toBe(false);
  });
  it('moves entries without mutating the original list', () => {
    const original = ['a', 'b', 'c'];
    expect(moveCoachItem(original, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(original).toEqual(['a', 'b', 'c']);
  });
  it('preserves server group identities and warmup assignments when editing a web template', () => {
    const result = normalizeCoachRoutine({
      name: 'Web',
      days: [
        {
          id: 'day',
          title: 'Día',
          groups: [{ id: 'server-group', groupType: 'CIRCUIT', sortOrder: 0 }],
          warmupTemplates: [{ id: 'warmup-a', name: 'Movilidad' }],
        },
      ],
    });
    const day = (result.days as Record<string, unknown>[])[0]!;
    expect(day.groups).toEqual([{ id: 'server-group', clientId: 'server-group', groupType: 'CIRCUIT', sortOrder: 0 }]);
    expect(day.warmupTemplateIds).toEqual(['warmup-a']);
  });
  it('preserves server per-set weight ranges when saving an existing routine', () => {
    const input = {
      name: 'Web',
      days: [
        {
          dayIndex: 1,
          title: 'Día',
          exercises: [
            {
              displayName: 'Press',
              fieldModes: [{ fieldKey: 'weight', mode: 'COACH_INPUT' }],
              sortOrder: 0,
              perSetWeightRangesJson: [{ minKg: 20, maxKg: 30 }],
            },
          ],
        },
      ],
    };
    const result = coachRoutineSchema.parse(normalizeCoachRoutine(input));
    expect(result.days[0]?.exercises[0]?.perSetWeightRanges).toEqual([{ minKg: 20, maxKg: 30 }]);
  });
  it('scales nutrition by the food unit, preserving missing values', () => {
    expect(nutritionAmountTotals({ caloriesKcal: 200, proteinG: 20, carbsG: 10, fatG: 5, servingUnit: '100g' }, 50)).toEqual(
      { caloriesKcal: 100, proteinG: 10, carbsG: 5, fatG: 2.5 },
    );
    expect(nutritionAmountTotals({ caloriesKcal: 200, proteinG: null, servingUnit: 'porcion' }, 2).caloriesKcal).toBe(400);
  });
});
