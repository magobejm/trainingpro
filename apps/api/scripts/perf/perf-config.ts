export const PERF_ORG_ID = 'c14c14c1-0000-4000-8000-000000000001';
export const PERF_COACH_USER_ID = 'c14c14c1-0000-4000-8000-000000000002';
export const PERF_COACH_UID = 'c14c14c1-0000-4000-8000-0000000000c0';
export const PERF_COACH_MEMBER_ID = 'c14c14c1-0000-4000-8000-000000000003';
export const PERF_OTHER_USER_ID = 'c14c14c1-0000-4000-8000-000000000004';
export const PERF_OTHER_UID = 'c14c14c1-0000-4000-8000-0000000000c1';
export const PERF_OTHER_MEMBER_ID = 'c14c14c1-0000-4000-8000-000000000005';
export const PERF_COACH_EMAIL = 'perf-coach@perf.local';
export const PERF_OTHER_EMAIL = 'perf-other@perf.local';

export type PerfVolume = {
  calendarEvents: number;
  clients: number;
  libraryPerType: number;
  messages: number;
  photos: number;
  routines: number;
  sessionsPerWeek: number;
  warmups: number;
  weeks: number;
};

export function readVolume(): PerfVolume {
  return {
    calendarEvents: 12,
    clients: readInt('PERF_CLIENTS', 150, 500),
    libraryPerType: readInt('PERF_LIBRARY_PER_TYPE', 100, 400),
    messages: readInt('PERF_MESSAGES', 3000, 20000),
    photos: readInt('PERF_PHOTOS', 8, 30),
    routines: readInt('PERF_ROUTINES', 80, 200),
    sessionsPerWeek: readInt('PERF_SESSIONS_PER_WEEK', 3, 7),
    warmups: 20,
    weeks: readInt('PERF_WEEKS', 52, 104),
  };
}

function readInt(name: string, fallback: number, max: number): number {
  const raw = process.env[name];
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new Error(`${name} must be an integer from 1 to ${max}`);
  }
  return value;
}
