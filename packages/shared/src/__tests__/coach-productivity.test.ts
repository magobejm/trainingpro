import { jacksonPollock3 } from '../anthropometry/body-fat';
import { estimateBilling } from '../billing/pricing-tier';
import { fatigueFromSleep, isHighMorningCheckin, isRiskClient } from '../triage/thresholds';

describe('coach productivity rules', () => {
  it('flags a poor night as high fatigue and a quiet client as risk', () => {
    expect(fatigueFromSleep(1)).toBe(5);
    expect(isHighMorningCheckin({ fatigue: fatigueFromSleep(2), pain: null })).toBe(true);
    expect(isHighMorningCheckin({ fatigue: 2, pain: 4 })).toBe(true);
    expect(isRiskClient({ adherence: 0.4, inactiveDays: 1 })).toBe(true);
    expect(isRiskClient({ adherence: 0.8, inactiveDays: 1 })).toBe(false);
  });

  it('charges each client at the price of their slot', () => {
    expect(estimateBilling(0)).toEqual({ count: 0, monthly: 0 });
    expect(estimateBilling(3).monthly).toBe(12);
    expect(estimateBilling(8).monthly).toBe(29);
    expect(estimateBilling(12).monthly).toBe(39);
    expect(estimateBilling(25).monthly).toBe(60);
  });

  it('turns three skinfolds into a body-fat percentage', () => {
    const fat = jacksonPollock3({ age: 30, sex: 'male', sites: { abdomen: 20, chest: 12, thigh: 18 } });
    expect(fat).toBeGreaterThan(10);
    expect(fat).toBeLessThan(25);
  });
});
