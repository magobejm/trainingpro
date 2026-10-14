import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClientNutritionMealGroups } from '@trainerpro/ui';
import { unavailablePreviewWarmups } from './routine-preview-warmups';

describe('client preview reference data', () => {
  it('reports unavailable warmups while preserving the original draft', () => {
    const draft = {
      name: 'A',
      days: [
        {
          id: 'd',
          title: 'D',
          blocks: [],
          warmupTemplates: [
            { id: 'missing', name: 'Movilidad' },
            { id: 'available', name: 'Fuerza' },
          ],
        },
      ],
    };
    const before = JSON.stringify(draft);
    expect(unavailablePreviewWarmups(draft, [{ id: 'available', name: 'Fuerza', groups: [], items: [] }])).toEqual([
      'Movilidad',
    ]);
    expect(JSON.stringify(draft)).toBe(before);
  });
  it('renders the same food considerations as the mobile view', () => {
    const html = renderToStaticMarkup(
      React.createElement(ClientNutritionMealGroups, {
        groups: [{ category: 'breakfast', items: [{ foodId: 'food', label: 'Avena', sublabel: '80 g' }] }],
        foods: [
          { id: 'food', name: 'Avena', considerations: [{ code: 'fiber', priority: 'P1', tone: 'good', variant: 1 }] },
        ],
        t: (key: string) => key,
      }),
    );
    expect(html).toContain('client.nutrition.considerations.fiber.1');
    expect(html).toContain('80 g');
  });
});
