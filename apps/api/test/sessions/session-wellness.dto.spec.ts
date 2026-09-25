import { FinishSessionDto } from '../../src/modules/sessions/presentation/dto/finish-session.dto';
import { StartSessionDto } from '../../src/modules/sessions/presentation/dto/start-session.dto';

describe('session wellness DTOs', () => {
  it('accepts start scores in the 1-10 range and nulls', () => {
    const result = StartSessionDto.schema.safeParse({
      preFatigue: 4,
      preMotivation: 8,
      preRecovery: null,
      startMode: 'INTERACTIVE',
    });
    expect(result.success).toBe(true);
  });

  it('rejects start scores outside 1-10', () => {
    expect(StartSessionDto.schema.safeParse({ preMotivation: 0 }).success).toBe(false);
    expect(StartSessionDto.schema.safeParse({ preFatigue: 11 }).success).toBe(false);
  });

  it('accepts finish scores, comment and incomplete flag', () => {
    const result = FinishSessionDto.schema.safeParse({
      comment: 'Good session',
      isIncomplete: false,
      postFatigue: 5,
      postMood: 9,
      postPain: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects finish scores outside 1-10', () => {
    expect(FinishSessionDto.schema.safeParse({ isIncomplete: false, postMood: 12 }).success).toBe(false);
  });
});
