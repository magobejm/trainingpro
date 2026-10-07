import { LogSetDto } from '../../src/modules/sessions/presentation/dto/log-set.dto';
import { LogIntervalDto } from '../../src/modules/sessions/presentation/dto/log-interval.dto';
import { LogMobilitySetDto } from '../../src/modules/sessions/presentation/dto/log-mobility-set.dto';
import { LogPlioSetDto } from '../../src/modules/sessions/presentation/dto/log-plio-set.dto';
import { LogSportSetDto } from '../../src/modules/sessions/presentation/dto/log-sport-set.dto';

const BLOCK_ID = '11111111-1111-4111-8111-111111111111';

const SESSION_ITEM_ID = '22222222-2222-4222-8222-222222222222';

describe('log set variable DTOs', () => {
  it('accepts half-step RPE and integer RIR, and rejects the rest', () => {
    const base = { repsDone: 8, sessionItemId: SESSION_ITEM_ID, setIndex: 1, weightDoneKg: 40 };
    expect(LogSetDto.schema.safeParse({ ...base, effortRpe: 7.5, effortRir: 2 }).success).toBe(true);
    expect(LogSetDto.schema.safeParse({ ...base, effortRpe: 7 }).success).toBe(true);
    expect(LogSetDto.schema.safeParse({ ...base, effortRpe: 7.3 }).success).toBe(false);
    expect(LogSetDto.schema.safeParse({ ...base, effortRpe: 10.5 }).success).toBe(false);
    expect(LogSetDto.schema.safeParse({ ...base, effortRir: 1.5 }).success).toBe(false);
    expect(LogSetDto.schema.safeParse({ ...base, effortRir: 11 }).success).toBe(false);
  });

  it('accepts plio durationSecondsDone', () => {
    const result = LogPlioSetDto.schema.safeParse({
      durationSecondsDone: 12,
      effortRpe: 7,
      repsDone: 8,
      sessionPlioBlockId: BLOCK_ID,
      setIndex: 1,
      weightDoneKg: 20,
    });
    expect(result.success).toBe(true);
  });

  it('accepts mobility weightDoneKg', () => {
    const result = LogMobilitySetDto.schema.safeParse({
      effortRpe: 6,
      repsDone: 10,
      romDone: 'completo',
      sessionMobilityBlockId: BLOCK_ID,
      setIndex: 2,
      weightDoneKg: 8.5,
    });
    expect(result.success).toBe(true);
  });

  it('accepts sport set logs with setIndex and the 10 variables', () => {
    const result = LogSportSetDto.schema.safeParse({
      durationSecondsDone: 90,
      effortRir: 2,
      effortRpe: 8,
      heartRateDone: 150,
      hrMaxPctDone: 85,
      hrReservePctDone: 70,
      repsDone: 12,
      restSecondsDone: 45,
      romDone: 'parcial',
      sessionSportBlockId: BLOCK_ID,
      setIndex: 1,
      weightDoneKg: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects sport set logs without setIndex', () => {
    expect(
      LogSportSetDto.schema.safeParse({
        effortRpe: 8,
        sessionSportBlockId: BLOCK_ID,
      }).success,
    ).toBe(false);
  });

  it('accepts cardio restSecondsDone', () => {
    const result = LogIntervalDto.schema.safeParse({
      durationSecondsDone: 120,
      effortRpe: 6,
      intervalIndex: 1,
      restSecondsDone: 30,
      sessionCardioBlockId: BLOCK_ID,
    });
    expect(result.success).toBe(true);
  });
});
