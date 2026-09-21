function snapshotJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('nutrition plan assignment clone', () => {
  it('copies setup and content so later edits to the clone do not mutate the source', () => {
    const source = {
      content: { columns: { breakfast: [{ id: 'm1', mealName: 'Avena' }] } },
      setupData: { tdee: 2400, proteinG: 150 },
    };
    const clone = {
      content: snapshotJson(source.content),
      setupData: snapshotJson(source.setupData),
      sourcePlanId: 'plan-source',
    };
    const clonedMeal = clone.content.columns.breakfast[0];
    const sourceMeal = source.content.columns.breakfast[0];
    if (!clonedMeal || !sourceMeal) {
      throw new Error('Expected breakfast meal snapshot');
    }

    clonedMeal.mealName = 'Avena editada';
    clone.setupData.tdee = 2800;

    expect(sourceMeal.mealName).toBe('Avena');
    expect(source.setupData.tdee).toBe(2400);
    expect(clone.sourcePlanId).toBe('plan-source');
  });
});
