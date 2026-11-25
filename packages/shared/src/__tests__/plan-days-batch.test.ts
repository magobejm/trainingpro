import { clientPlanDayBatchResponseSchema } from '../http';

describe('clientPlanDayBatchResponseSchema', () => {
  it('accepts days keyed by plan day id and date', () => {
    const body = { items: [{ day: { id: 'a1', name: 'Día A' }, on: '2026-11-24', planDayId: 'a1' }] };
    expect(clientPlanDayBatchResponseSchema.parse(body)).toEqual(body);
    expect(clientPlanDayBatchResponseSchema.parse({ items: [] })).toEqual({ items: [] });
  });

  it('rejects a malformed date or a missing day', () => {
    expect(
      clientPlanDayBatchResponseSchema.safeParse({ items: [{ day: {}, on: '24/11/2026', planDayId: 'a1' }] }).success,
    ).toBe(false);
    expect(clientPlanDayBatchResponseSchema.safeParse({ items: [{ on: '2026-11-24', planDayId: 'a1' }] }).success).toBe(
      false,
    );
  });
});
