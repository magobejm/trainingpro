import { mapClientMeasurement } from '../../src/modules/clients/domain/client-measurement';

describe('mapClientMeasurement', () => {
  it('keeps body fat, heart rate and numeric skinfolds', () => {
    const mapped = mapClientMeasurement({
      bodyFatPct: 18,
      clientId: 'client',
      createdAt: new Date('2026-10-09T00:00:00.000Z'),
      fcMax: 180,
      fcRest: 58,
      heightCm: null,
      hipCm: 98,
      id: 'measure',
      recordedBy: 'coach',
      skinfoldsJson: { triceps: 12, note: 'skip' },
      waistCm: 78,
      weightKg: 68.5,
    });

    expect(mapped.bodyFatPct).toBe(18);
    expect(mapped.fcRest).toBe(58);
    expect(mapped.fcMax).toBe(180);
    expect(mapped.skinfoldsJson).toEqual({ triceps: 12 });
  });
});
