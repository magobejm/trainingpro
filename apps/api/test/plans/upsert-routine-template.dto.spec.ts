import { strengthSetSchema } from '../../src/modules/plans/presentation/dto/upsert-routine-template.dto';

describe('UpsertRoutineTemplateDto strengthSetSchema', () => {
  it('accepts decimal weight and half-step RPE', () => {
    const result = strengthSetSchema.safeParse({
      setIndex: 0,
      weightKg: 30.6,
      rpe: 7.5,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weightKg).toBe(30.6);
      expect(result.data.rpe).toBe(7.5);
    }
  });

  it('accepts integer RPE values', () => {
    const result = strengthSetSchema.safeParse({
      setIndex: 1,
      rpe: 8,
    });

    expect(result.success).toBe(true);
  });

  it('rejects RPE values that are not half-step increments', () => {
    const result = strengthSetSchema.safeParse({
      setIndex: 0,
      rpe: 7.3,
    });

    expect(result.success).toBe(false);
  });

  it('rejects RPE outside the allowed range', () => {
    expect(
      strengthSetSchema.safeParse({
        setIndex: 0,
        rpe: 0.5,
      }).success,
    ).toBe(false);

    expect(
      strengthSetSchema.safeParse({
        setIndex: 0,
        rpe: 10.5,
      }).success,
    ).toBe(false);
  });
});
