import { describe, expect, it } from 'vitest';
import { nutritionPdfSections, routinePdfSections } from './plan-document';
import type { DraftState } from '../../screens/coach/RoutinePlanner.types';
import type { WarmupTemplateView } from '../../data/hooks/useWarmupTemplates';

const t = (key: string) => key;

describe('routine PDF prescription', () => {
  it('includes every day, all sets and their values, notes, group and NEAT without changing the draft', () => {
    const draft: DraftState = {
      name: 'Rutina',
      days: [
        {
          id: 'd1',
          title: 'Día 1',
          notesTitle: 'Indicaciones',
          notes: 'Sin dolor',
          groups: [{ id: 'g', groupType: 'SUPERSET', sortOrder: 0, note: 'Alternar' }],
          blocks: [
            {
              id: 'a',
              type: 'strength',
              displayName: 'Sentadilla',
              setsPlanned: 3,
              groupId: 'g',
              sets: [
                {
                  setIndex: 0,
                  reps: 12,
                  weightKg: 0,
                  rir: 0,
                  rpe: 7.5,
                  restSeconds: 60,
                  advancedTechnique: 'dropSet',
                  note: 'Controlar bajada',
                },
                { setIndex: 1, reps: 10, weightKg: 20 },
                { setIndex: 2, reps: 8, weightKg: 25 },
              ],
            },
          ],
        },
        {
          id: 'd2',
          title: 'Día 2',
          blocks: [
            {
              id: 'b',
              type: 'isometric',
              displayName: 'Plancha',
              setsPlanned: 1,
              sets: [{ setIndex: 0, durationSeconds: 45 }],
            },
          ],
        },
      ],
      neats: [{ id: 'n', title: 'Andar', description: '10000 pasos' }],
    };
    const before = JSON.stringify(draft);
    const sections = routinePdfSections(draft, [], t);
    expect(sections.map((section) => section.heading)).toContain('Día 2');
    const table = sections.find((section) => section.heading === 'Sentadilla')?.table;
    expect(table?.rows).toHaveLength(3);
    expect(table?.rows[0]).toEqual(expect.arrayContaining([1, '12', '0', '7.5', '60', 'dropSet', 'Controlar bajada']));
    const all = JSON.stringify(sections);
    for (const value of ['Sin dolor', 'Alternar', '10000 pasos', '45']) expect(all).toContain(value);
    expect(JSON.stringify(draft)).toBe(before);
  });
});

describe('legacy routine PDF prescription', () => {
  it('preserves legacy CSV series with explicit per-set values taking precedence and translates techniques', () => {
    const draft: DraftState = {
      name: 'Legacy',
      days: [
        {
          id: 'd',
          title: 'Día',
          blocks: [
            {
              id: 'e',
              type: 'strength',
              displayName: 'Press',
              setsPlanned: 3,
              repsPerSeries: '12,10,8',
              weightPerSeriesKg: '0,20,25',
              weightKg: 50,
              repsPlanned: 6,
              sets: [
                { setIndex: 0, advancedTechnique: 'dropSet' },
                { setIndex: 1, weightKg: 22 },
              ],
            },
          ],
        },
      ],
    };
    const translate = (key: string) => (key === 'coach.routine.advancedTechnique.dropSet' ? 'Drop set' : key);
    const table = routinePdfSections(draft, [], translate).find((section) => section.table)?.table;
    expect(table?.rows[0]).toEqual(expect.arrayContaining(['12', '0', 'Drop set']));
    expect(table?.rows[1]).toEqual(expect.arrayContaining(['10', '22']));
    expect(table?.rows[2]).toEqual(expect.arrayContaining(['8', '25']));
  });
  it('exports warmup groups, scalar prescriptions and metadata sets without leaking storage metadata', () => {
    const warmup: WarmupTemplateView = {
      id: 'w',
      name: 'Calentar',
      scope: 'COACH',
      coachMembershipId: null,
      createdAt: '',
      updatedAt: '',
      templateVersion: 1,
      groups: [{ id: 'g', groupType: 'CIRCUIT', sortOrder: 0, note: 'Repetir sin pausa' }],
      items: [
        {
          blockType: 'strength',
          displayName: 'Remo',
          sortOrder: 0,
          groupId: 'g',
          setsPlanned: 2,
          notes: 'Control suave\n[meta] {"repeticiones":12,"pesoKg":15}',
          metadataJson: { sets: [{ setIndex: 1, weightKg: 18, note: 'Apretar', advancedTechnique: 'unknownCustom' }] },
        },
        {
          blockType: 'cardio',
          displayName: 'Bici',
          sortOrder: 1,
          roundsPlanned: 2,
          workSeconds: 40,
          notes: '[meta] {"intensidadFcMax":75,"pulsaciones":140}',
        },
      ],
    };
    const draft: DraftState = {
      name: 'Rutina',
      days: [{ id: 'd', title: 'Día', blocks: [], warmupTemplates: [{ id: 'w', name: 'Calentar' }] }],
    };
    const before = JSON.stringify(warmup);
    const sections = routinePdfSections(draft, [warmup], t);
    const remo = sections.find((section) => section.heading === 'Remo');
    expect(remo?.table?.rows).toHaveLength(2);
    expect(remo?.table?.rows[0]).toEqual(expect.arrayContaining(['12', '15']));
    expect(remo?.table?.rows[1]).toEqual(expect.arrayContaining(['12', '18', 'Apretar', 'unknownCustom']));
    const all = JSON.stringify(sections);
    for (const text of ['Repetir sin pausa', 'Control suave', '75', '140', '40']) expect(all).toContain(text);
    expect(all).not.toContain('[meta]');
    expect(JSON.stringify(warmup)).toBe(before);
  });
});

describe('nutrition PDF content', () => {
  it('includes all weeks and meal ingredients, quantities and notes', () => {
    const sections = nutritionPdfSections(
      {
        name: 'Plan',
        type: 'ESTRUCTURADO',
        setupData: { targetCalories: 2000 },
        content: {
          weeks: [
            {
              id: 'w1',
              label: 'Semana 1',
              days: [{ id: 'd1', label: 'Lunes', meals: [{ id: 'x', mealId: 'meal', name: 'Desayuno', time: '08:00' }] }],
            },
            {
              id: 'w2',
              label: 'Semana 2',
              days: [{ id: 'd2', label: 'Martes', meals: [{ id: 'y', mealId: 'missing', name: 'Comida pendiente' }] }],
            },
          ],
        },
      },
      [
        {
          id: 'meal',
          name: 'Desayuno',
          category: 'breakfast',
          notes: 'Sin azúcar',
          ingredients: [
            {
              foodId: 'food',
              amountGrams: 80,
              sortOrder: 0,
              food: { id: 'food', name: 'Avena', caloriesKcal: 300, carbsG: 40, proteinG: 10, fatG: 5 },
            },
          ],
        },
      ],
      t,
    );
    const all = JSON.stringify(sections);
    for (const value of ['Semana 1', 'Semana 2', 'Avena', '80', '08:00', 'Sin azúcar', 'Comida pendiente'])
      expect(all).toContain(value);
    expect(all).toContain('web.pdf.unavailable');
  });
  it('preserves free-plan food amounts including zero', () => {
    const sections = nutritionPdfSections(
      {
        name: 'Libre',
        type: 'LIBRE',
        content: { columns: { breakfast: [{ id: 'a', type: 'food', foodName: 'Pan', amountGrams: 0 }] } },
      },
      [],
      t,
    );
    expect(JSON.stringify(sections)).toContain('Pan');
    expect(JSON.stringify(sections)).toContain('0 g');
  });
});
