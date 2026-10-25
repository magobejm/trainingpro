import { nutritionStreakWeeks } from '../../src/modules/clients/application/nutrition-streak';

const plan = {
  content: { columns: { breakfast: [{ amountGrams: 80, foodId: 'oats', foodName: 'Avena', id: '1', type: 'food' }] } },
  createdAt: new Date(2020, 0, 1),
  type: 'LIBRE' as const,
};

function days(from: Date, count: number): Array<{ date: string; status: 'DONE' }> {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(from);
    date.setDate(from.getDate() + index);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return { date: `${date.getFullYear()}-${month}-${day}`, status: 'DONE' as const };
  });
}

it('skips the current week until it reaches 80 percent', () => {
  const today = new Date(2026, 9, 24);
  const logs = [...days(new Date(2026, 8, 28), 7), ...days(new Date(2026, 9, 5), 7), ...days(new Date(2026, 9, 12), 7)];
  expect(nutritionStreakWeeks([plan], logs, today)).toBe(3);
});

it('includes the current week when it already qualifies', () => {
  const today = new Date(2026, 9, 24);
  const logs = [...days(new Date(2026, 9, 12), 7), ...days(new Date(2026, 9, 19), 6)];
  expect(nutritionStreakWeeks([plan], logs, today)).toBe(2);
});

it('returns zero when no week reaches the threshold', () => {
  expect(nutritionStreakWeeks([plan], [], new Date(2026, 9, 24))).toBe(0);
});
