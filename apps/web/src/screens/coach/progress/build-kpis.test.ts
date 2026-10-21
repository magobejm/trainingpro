import { describe, it, expect } from 'vitest';
import { buildKpis } from './build-kpis';
const base = { range: { from: '2026-10-01', to: '2026-10-20' }, exercisePr: null, cycleDays: 7, planDaysCount: 3 };
describe('recorded KPI values', () => {
  it('does not invent zero strength measurements', () => {
    expect(buildKpis({ ...base, mode: 'exercise', points: [{ e1rm: null }] }).find((k) => k.id === 'e1rm')?.value).toBe('—');
  });
  it('never estimates adherence from routine cycles', () => {
    expect(
      buildKpis({ ...base, mode: 'microcycle', points: [{ sessionsCount: 3, avgE1rm: null }] }).find(
        (k) => k.id === 'adherence',
      )?.value,
    ).toBe('—');
  });
});
