export type ShiftableRest = {
  endAt: number;
  lastSeenAt: number;
  seconds: number;
};

export function shiftRest<T extends ShiftableRest>(rest: T, deltaSeconds: number, now: number): T {
  const remaining = Math.max(0, Math.ceil((rest.endAt - now) / 1000));
  const nextRemaining = Math.max(0, remaining + deltaSeconds);
  const applied = nextRemaining - remaining;
  return {
    ...rest,
    endAt: rest.endAt + applied * 1000,
    lastSeenAt: now,
    seconds: Math.max(0, rest.seconds + applied),
  };
}

export function restItemId(setKey: string): string | null {
  const split = setKey.lastIndexOf(':');
  if (split <= 0) return null;
  return setKey.slice(0, split);
}

export function shouldAutoStartRest(input: {
  enabled: boolean;
  readOnly: boolean;
  restActive: boolean;
  restDone: boolean;
  restSeconds: number;
}): boolean {
  return input.enabled && !input.readOnly && input.restSeconds > 0 && !input.restActive && !input.restDone;
}

type SaveRun = () => Promise<readonly string[] | void> | readonly string[] | void;

export async function saveSetAndMaybeRest(input: {
  enabled: boolean;
  readOnly: boolean;
  restActive: boolean;
  restDone: boolean;
  restSeconds: number;
  run: SaveRun;
  start: () => void;
}): Promise<void> {
  const outcomes = await input.run();
  if (!outcomes || outcomes.includes('failed')) return;
  if (shouldAutoStartRest(input)) input.start();
}
