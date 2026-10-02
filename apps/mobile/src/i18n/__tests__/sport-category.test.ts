import webEs from '../../../../web/src/i18n/locales/es/common.json';

describe('web Spanish sport category labels', () => {
  it('uses Deporte, not Deportación', () => {
    expect(webEs['coach.library.categories.sport']).toBe('Deporte');
    expect(webEs['coach.library.categories.sportTypes']).toBe('Deporte');
    expect(webEs['coach.routine.blockType.sport']).toBe('Deporte');
    expect(webEs['coach.progress.filter.category.sport']).toBe('Deporte');
    expect(JSON.stringify(webEs)).not.toMatch(/deportaci/i);
  });
});
