import { describe, expect, it } from 'vitest';
import { colors } from '@trainerpro/ui';
import { calendarEventColor, getColorForHex } from './calendar-screen.utils';
describe('saved calendar colors', () => {
  it('keeps old orange workouts in the warning family', () => {
    expect(getColorForHex('#ffedd5').bg).toBe(colors.warningSoft);
  });
  it('keeps old rose workouts in the danger family', () => {
    expect(getColorForHex('#ffe4e6').bg).toBe(colors.dangerSoft);
  });
  it('resolves current token colors unchanged', () => {
    expect(getColorForHex(colors.chartPurpleSoft).text).toBe(colors.chartPurple);
  });
});

it('uses identical event colors for grid and detail despite historical saved colors', () => {
  expect(calendarEventColor({ type: 'call', color: '#065f46' }).bg).toBe(colors.successSoft);
  expect(calendarEventColor({ type: 'note', color: '#172554' }).bg).toBe(colors.infoSoft);
  expect(calendarEventColor({ type: 'physical_test', color: '#312e81' }).bg).toBe(colors.primarySoft);
});
