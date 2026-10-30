import { feedbackCutoff, filterFeedback, splitByAge, type FeedbackLike } from '../client-feedback';

type Item = FeedbackLike & { text: string };
const item = (createdAt: string, category: Item['category'], text = ''): Item => ({ category, createdAt, text });
const text = (entry: Item) => entry.text;

describe('filterFeedback', () => {
  const items = [
    item('2026-10-20T10:00:00.000Z', 'EXERCISE', 'Dolor de hombro en press'),
    item('2026-10-10T10:00:00.000Z', 'OTHER', 'Llegué tarde'),
    item('2026-09-01T10:00:00.000Z', 'EXERCISE', 'Muy pesado'),
  ];

  it('shows only exercises by default and everything when asked', () => {
    expect(filterFeedback(items, { scope: 'EXERCISE' }, text)).toHaveLength(2);
    expect(filterFeedback(items, { scope: 'ALL' }, text)).toHaveLength(3);
  });

  it('searches in the text without caring about case', () => {
    expect(filterFeedback(items, { query: 'HOMBRO', scope: 'ALL' }, text)).toHaveLength(1);
  });

  it('keeps only the chosen week, both ends included', () => {
    const result = filterFeedback(items, { from: '2026-10-10', scope: 'ALL', to: '2026-10-20' }, text);
    expect(result.map((entry) => entry.text)).toEqual(['Dolor de hombro en press', 'Llegué tarde']);
  });
});

describe('splitByAge', () => {
  const now = new Date('2026-10-30T12:00:00.000Z');

  it('moves what is older than four months to the drawer, newest first', () => {
    const { older, recent } = splitByAge(
      [
        item('2026-06-29T00:00:00.000Z', 'OTHER'),
        item('2026-10-01T00:00:00.000Z', 'OTHER'),
        item('2026-07-02T00:00:00.000Z', 'OTHER'),
      ],
      now,
    );
    expect(feedbackCutoff(now).toISOString().slice(0, 10)).toBe('2026-06-30');
    expect(recent.map((entry) => entry.createdAt.slice(0, 10))).toEqual(['2026-10-01', '2026-07-02']);
    expect(older.map((entry) => entry.createdAt.slice(0, 10))).toEqual(['2026-06-29']);
  });
});
