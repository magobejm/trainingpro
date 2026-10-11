import { ForbiddenException } from '@nestjs/common';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { EmitSessionCompletedEventUseCase } from '../../src/modules/notifications/application/use-cases/emit-session-completed-event.usecase';
import { FinishCardioSessionUseCase } from '../../src/modules/sessions/application/use-cases/finish-cardio-session.usecase';
import { FinishSessionUseCase } from '../../src/modules/sessions/application/use-cases/finish-session.usecase';
import { LogIntervalUseCase } from '../../src/modules/sessions/application/use-cases/log-interval.usecase';
import { LogIsometricSetUseCase } from '../../src/modules/sessions/application/use-cases/log-isometric-set.usecase';
import { LogMobilitySetUseCase } from '../../src/modules/sessions/application/use-cases/log-mobility-set.usecase';
import { LogPlioSetUseCase } from '../../src/modules/sessions/application/use-cases/log-plio-set.usecase';
import { LogSetUseCase } from '../../src/modules/sessions/application/use-cases/log-set.usecase';
import { LogSportSetUseCase } from '../../src/modules/sessions/application/use-cases/log-sport-set.usecase';
import { LogSportUseCase } from '../../src/modules/sessions/application/use-cases/log-sport.usecase';
import { EditWindowPolicy } from '../../src/modules/sessions/domain/policies/edit-window.policy';
import { SessionAccessPolicy } from '../../src/modules/sessions/domain/policies/session-access.policy';
import type { SessionsRepositoryPort } from '../../src/modules/sessions/domain/sessions-repository.port';

const SESSION_DATE = new Date('2026-09-07T00:00:00.000Z');
const AUTH: AuthContext = { activeRole: 'coach', roles: ['coach'], subject: 'coach-a' };
const LATE = new Date('2026-09-07T22:00:00.000Z');
const OPEN = new Date('2026-09-07T18:50:00.000Z');
const WRITE_NAMES = [
  'log set',
  'log interval',
  'log plio',
  'log mobility',
  'log isometric',
  'log sport',
  'log sport set',
  'finish',
  'finish cardio',
] as const;

type Write = jest.Mock;
type Case = { name: string; run: (offset: number) => Promise<unknown>; write: Write };

describe('edit window on every session write', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(WRITE_NAMES)('rejects %s after the local day and does not write', async (name) => {
    jest.setSystemTime(LATE);
    const entry = build().find((item) => item.name === name);
    await expect(entry?.run(120)).rejects.toBeInstanceOf(ForbiddenException);
    expect(entry?.write).not.toHaveBeenCalled();
  });

  it.each(WRITE_NAMES)('writes %s while the local day is open', async (name) => {
    jest.setSystemTime(OPEN);
    const entry = build().find((item) => item.name === name);
    await entry?.run(120);
    expect(entry?.write).toHaveBeenCalledTimes(1);
  });
});

function build(): Case[] {
  const writes = {
    finish: jest.fn(async () => ({ id: 'session' })),
    finishCardio: jest.fn(async () => ({ id: 'session' })),
    logInterval: jest.fn(async () => ({})),
    logIsometric: jest.fn(async () => ({})),
    logMobility: jest.fn(async () => ({})),
    logPlio: jest.fn(async () => ({})),
    logSet: jest.fn(async () => ({})),
    logSport: jest.fn(async () => ({})),
    logSportSet: jest.fn(async () => ({})),
  };
  const repository = {
    canAccessSession: async () => true,
    finishCardioSession: writes.finishCardio,
    finishSession: writes.finish,
    getCardioSessionById: async () => ({ sessionDate: SESSION_DATE }),
    getSessionById: async () => ({ sessionDate: SESSION_DATE }),
    logInterval: writes.logInterval,
    logIsometricSet: writes.logIsometric,
    logMobilitySet: writes.logMobility,
    logPlioSet: writes.logPlio,
    logSet: writes.logSet,
    logSport: writes.logSport,
    logSportSet: writes.logSportSet,
  } as unknown as SessionsRepositoryPort;
  const access = new SessionAccessPolicy(repository);
  const window = new EditWindowPolicy();
  const emit = { execute: async () => undefined } as unknown as EmitSessionCompletedEventUseCase;
  return [
    {
      name: 'log set',
      run: (offset) => new LogSetUseCase(repository, access, window).execute(AUTH, setInput(), offset),
      write: writes.logSet,
    },
    {
      name: 'log interval',
      run: (offset) => new LogIntervalUseCase(repository, access, window).execute(AUTH, intervalInput(), offset),
      write: writes.logInterval,
    },
    {
      name: 'log plio',
      run: (offset) => new LogPlioSetUseCase(repository, access, window).execute(AUTH, plioInput(), offset),
      write: writes.logPlio,
    },
    {
      name: 'log mobility',
      run: (offset) => new LogMobilitySetUseCase(repository, access, window).execute(AUTH, mobilityInput(), offset),
      write: writes.logMobility,
    },
    {
      name: 'log isometric',
      run: (offset) => new LogIsometricSetUseCase(repository, access, window).execute(AUTH, isometricInput(), offset),
      write: writes.logIsometric,
    },
    {
      name: 'log sport',
      run: (offset) => new LogSportUseCase(repository, access, window).execute(AUTH, sportInput(), offset),
      write: writes.logSport,
    },
    {
      name: 'log sport set',
      run: (offset) => new LogSportSetUseCase(repository, access, window).execute(AUTH, sportSetInput(), offset),
      write: writes.logSportSet,
    },
    {
      name: 'finish',
      run: (offset) => new FinishSessionUseCase(repository, access, window, emit).execute(AUTH, finishInput(), offset),
      write: writes.finish,
    },
    {
      name: 'finish cardio',
      run: (offset) => new FinishCardioSessionUseCase(repository, access, window, emit).execute(AUTH, finishInput(), offset),
      write: writes.finishCardio,
    },
  ];
}

function setInput() {
  return { sessionId: 'session', sessionItemId: 'item', setIndex: 1 };
}

function intervalInput() {
  return { intervalIndex: 1, sessionCardioBlockId: 'block', sessionId: 'session' };
}

function plioInput() {
  return { sessionId: 'session', sessionPlioBlockId: 'block', setIndex: 1 };
}

function mobilityInput() {
  return { sessionId: 'session', sessionMobilityBlockId: 'block', setIndex: 1 };
}

function isometricInput() {
  return { sessionId: 'session', sessionIsometricBlockId: 'block', setIndex: 1 };
}

function sportInput() {
  return { sessionId: 'session', sessionSportBlockId: 'block' };
}

function sportSetInput() {
  return { sessionId: 'session', sessionSportBlockId: 'block', setIndex: 1 };
}

function finishInput() {
  return { isIncomplete: false, sessionId: 'session' };
}
