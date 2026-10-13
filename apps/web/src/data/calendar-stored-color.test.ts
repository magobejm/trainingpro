import { describe, expect, it } from 'vitest';
import { calendarStoredColor } from './calendar-stored-color';
import { lightColors } from '@trainerpro/ui';

describe('persisted calendar colors', () => {
  it('stores literal colors for mobile rather than browser-only variables', () => {
    expect(calendarStoredColor('var(--tp-primarySoft)')).toBe(lightColors.primarySoft);
    expect(calendarStoredColor(`var(--tp-chartPurpleSoft, ${lightColors.chartPurpleSoft})`)).toBe(
      lightColors.chartPurpleSoft,
    );
  });
  it('keeps existing saved colors and absent fields unchanged', () => {
    expect(calendarStoredColor(lightColors.warningSoft)).toBe(lightColors.warningSoft);
    expect(calendarStoredColor(undefined)).toBeUndefined();
  });
});
