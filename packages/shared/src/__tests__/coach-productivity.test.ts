import { jacksonPollock3 } from '../anthropometry/body-fat';
import { estimateBilling } from '../billing/pricing-tier';
import {
  applyProgression,
  linearDeloadPreset,
  progressionWeekIndex,
  suggestNextWeight,
} from '../progression/apply-progression';
import { fatigueFromSleep, isHighMorningCheckin, isRiskClient } from '../triage/thresholds';

const base = [{ repsMax: 10, repsMin: 8, setIndex: 0, targetRir: 2, weightKg: 60 }];

describe('coach productivity rules', () => {
  it('raises the load for three weeks and deloads on the fourth', () => {
    const rule = linearDeloadPreset();
    expect(applyProgression(base, rule, 2)[0]?.weightKg).toBe(65);
    const deload = applyProgression(
      [
        { ...base[0]!, setIndex: 0 },
        { ...base[0]!, setIndex: 1 },
      ],
      rule,
      3,
    );
    expect(deload).toHaveLength(1);
    expect(deload[0]?.weightKg).toBe(42);
  });

  it('suggests 2.5 kg when the top of the rep range is done at the target RIR', () => {
    const rule = linearDeloadPreset().autoLoad!;
    expect(suggestNextWeight({ performedReps: 10, repsMax: 10, rir: 3, rule, weightKg: 60 })).toBe(62.5);
    expect(suggestNextWeight({ performedReps: 9, repsMax: 10, rir: 3, rule, weightKg: 60 })).toBeNull();
  });

  it('wraps the week index inside the block', () => {
    const applied = new Date('2026-10-01T00:00:00Z');
    const later = new Date('2026-10-29T00:00:00Z');
    expect(progressionWeekIndex(applied, later, 4)).toBe(0);
  });

  it('flags a poor night as high fatigue and a quiet client as risk', () => {
    expect(fatigueFromSleep(1)).toBe(5);
    expect(isHighMorningCheckin({ fatigue: fatigueFromSleep(2), pain: null })).toBe(true);
    expect(isHighMorningCheckin({ fatigue: 2, pain: 4 })).toBe(true);
    expect(isRiskClient({ adherence: 0.4, inactiveDays: 1 })).toBe(true);
    expect(isRiskClient({ adherence: 0.8, inactiveDays: 1 })).toBe(false);
  });

  it('estimates the current price tier and the distance to the next one', () => {
    const estimate = estimateBilling(8, [
      { fromClients: 1, monthlyPrice: 29, toClients: 10 },
      { fromClients: 11, monthlyPrice: 49, toClients: 25 },
    ]);
    expect(estimate.estimatedMonthly).toBe(29);
    expect(estimate.clientsToNext).toBe(3);
  });

  it('turns three skinfolds into a body-fat percentage', () => {
    const fat = jacksonPollock3({ age: 30, sex: 'male', sites: { abdomen: 20, chest: 12, thigh: 18 } });
    expect(fat).toBeGreaterThan(10);
    expect(fat).toBeLessThan(25);
  });
});
