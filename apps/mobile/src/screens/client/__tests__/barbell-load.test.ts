import { estimateE1rm, platesPerSide, weightForRpe } from '../barbell-load';

it('loads one 20 kg plate per side on a 20 kg bar', () => {
  expect(platesPerSide(60, 20)).toMatchObject({ loadedKg: 60, plates: [20], remainderKg: 0 });
});

it('adds a 1.25 kg plate for 62.5 kg', () => {
  expect(platesPerSide(62.5, 20).plates).toEqual([20, 1.25]);
});

it('keeps the closest load at or below the target', () => {
  expect(platesPerSide(61, 20)).toMatchObject({ loadedKg: 60, plates: [20], remainderKg: 1 });
});

it('loads 10 and 2.5 kg plates on a 15 kg bar', () => {
  expect(platesPerSide(40, 15)).toMatchObject({ loadedKg: 40, plates: [10, 2.5], remainderKg: 0 });
});

it('says when the bar is heavier than the target', () => {
  expect(platesPerSide(10, 20)).toMatchObject({ barExceeds: true, loadedKg: 20, plates: [] });
});

it('inverts Brzycki for the same reps and RPE', () => {
  const e1rm = estimateE1rm(80, 5, 10, 0);
  expect(e1rm).toBe(90.01);
  expect(weightForRpe(e1rm ?? 0, 5, 10)).toBe(80);
});
