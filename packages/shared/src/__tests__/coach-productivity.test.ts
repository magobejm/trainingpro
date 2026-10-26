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
