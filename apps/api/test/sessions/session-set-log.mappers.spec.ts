import { Prisma } from '@prisma/client';
import {
  mapMobilitySetLog,
  mapPlioSetLog,
  mapSportSetLog,
} from '../../src/modules/sessions/infra/prisma/sessions-prisma.mappers';

describe('session set-log mappers', () => {
  it('maps plio durationSecondsDone', () => {
    expect(
      mapPlioSetLog({
        durationSecondsDone: 15,
        effortRpe: 7,
        repsDone: 8,
        sessionPlioBlockId: 'plio-1',
        setIndex: 1,
        weightDoneKg: new Prisma.Decimal(20),
      }),
    ).toEqual({
      durationSecondsDone: 15,
      effortRpe: 7,
      repsDone: 8,
      sessionPlioBlockId: 'plio-1',
      setIndex: 1,
      weightDoneKg: 20,
    });
  });

  it('maps mobility weightDoneKg', () => {
    expect(
      mapMobilitySetLog({
        effortRpe: 6,
        repsDone: 10,
        romDone: 'completo',
        sessionMobilityBlockId: 'mob-1',
        setIndex: 2,
        weightDoneKg: new Prisma.Decimal(8.5),
      }),
    ).toEqual({
      effortRpe: 6,
      repsDone: 10,
      romDone: 'completo',
      sessionMobilityBlockId: 'mob-1',
      setIndex: 2,
      weightDoneKg: 8.5,
    });
  });

  it('maps sport set logs with setIndex and logged fields', () => {
    expect(
      mapSportSetLog({
        durationSecondsDone: 90,
        effortRir: 2,
        effortRpe: 8,
        heartRateDone: 150,
        hrMaxPctDone: 85,
        hrReservePctDone: 70,
        repsDone: 12,
        restSecondsDone: 45,
        romDone: 'parcial',
        sessionSportBlockId: 'sport-1',
        setIndex: 1,
        weightDoneKg: new Prisma.Decimal(5),
      }),
    ).toEqual({
      durationSecondsDone: 90,
      effortRir: 2,
      effortRpe: 8,
      heartRateDone: 150,
      hrMaxPctDone: 85,
      hrReservePctDone: 70,
      repsDone: 12,
      restSecondsDone: 45,
      romDone: 'parcial',
      sessionSportBlockId: 'sport-1',
      setIndex: 1,
      weightDoneKg: 5,
    });
  });
});
