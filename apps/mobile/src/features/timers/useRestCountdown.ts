import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { remainingSeconds, rewindEndAt } from './countdown';
import { pulseRestEnd } from './rest-feedback';

export type RestClock = {
  endAt: number;
  lastSeenAt: number;
  seconds: number;
};

export function useRestCountdown(
  rest: RestClock | null,
  onAdjust: (endAt: number, lastSeenAt: number) => void,
  onFinish: () => void,
): number | null {
  const restRef = useRef(rest);
  const onAdjustRef = useRef(onAdjust);
  const onFinishRef = useRef(onFinish);
  const finishedFor = useRef<number | null>(null);
  restRef.current = rest;
  onAdjustRef.current = onAdjust;
  onFinishRef.current = onFinish;
  const [remaining, setRemaining] = useState<number | null>(() => readRemaining(rest));

  useEffect(() => {
    const current = restRef.current;
    if (!current) {
      setRemaining(null);
      return;
    }
    let seen = current.lastSeenAt;
    let endAt = current.endAt;
    const tick = () => {
      const live = restRef.current;
      if (!live) return;
      const now = Date.now();
      if (now < seen) {
        endAt = rewindEndAt(endAt, seen, now);
        seen = now;
        onAdjustRef.current(endAt, now);
      } else {
        seen = now;
      }
      const next = remainingSeconds(endAt, live.seconds, now);
      setRemaining(next);
      if (next > 0 || finishedFor.current === endAt) return;
      finishedFor.current = endAt;
      pulseRestEnd();
      onFinishRef.current();
    };
    tick();
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        tick();
        return;
      }
      if (restRef.current) onAdjustRef.current(endAt, Date.now());
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [rest?.endAt, rest?.seconds, rest == null]);

  return remaining;
}

function readRemaining(rest: RestClock | null): number | null {
  if (!rest) return null;
  const now = Date.now();
  const endAt = now < rest.lastSeenAt ? rewindEndAt(rest.endAt, rest.lastSeenAt, now) : rest.endAt;
  return remainingSeconds(endAt, rest.seconds, now);
}
