import { mergeLastActivities } from '../../src/modules/clients/infra/prisma/client-last-activity.prisma';
describe('last completed client activity', () => {
  it('uses the latest finish time even if sessions were completed out of scheduled order', () => {
    const lateFinish = new Date('2026-10-12T12:00:00Z');
    const result = mergeLastActivities([
      { clientId: 'client', at: new Date('2026-10-10T12:00:00Z') },
      { clientId: 'client', at: lateFinish },
    ]);
    expect(result.get('client')).toEqual(lateFinish);
  });
  it('compares legacy date fallbacks with recorded finish times', () => {
    const legacyDate = new Date('2026-10-11T00:00:00Z');
    const result = mergeLastActivities([
      { clientId: 'client', at: legacyDate },
      { clientId: 'client', at: new Date('2026-10-10T12:00:00Z') },
      { clientId: 'other', at: null },
    ]);
    expect(result.get('client')).toEqual(legacyDate);
    expect(result.has('other')).toBe(false);
  });
  it('does not fabricate activity for clients without completed sessions', () => {
    expect(mergeLastActivities([]).size).toBe(0);
  });
});
